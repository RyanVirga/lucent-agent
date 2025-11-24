// Workflow Engine Core
// Handles workflow instantiation, event handling, and step execution

import { supabaseAdmin } from '@/server/db/supabaseClient'
import type { Deal, WorkflowStep, WorkflowRun, WorkflowRunStep } from '@/types/database'
import type { DealEvent, WorkflowContext } from '@/types/workflows'
import { parseAutoConfig, isSendEmailConfig, isCreateTaskConfig, isUpdateFieldConfig, isWaitForEventConfig } from './types'

/**
 * Calculate scheduled date for a workflow step based on relative_to and offset_days
 */
export function calculateScheduledDate(
  deal: Deal,
  relativeTo: string | null,
  offsetDays: number
): Date {
  let baseDate: Date

  switch (relativeTo) {
    case 'coe_date':
      baseDate = deal.coe_date ? new Date(deal.coe_date) : new Date()
      break
    case 'inspection_deadline':
      baseDate = deal.inspection_deadline ? new Date(deal.inspection_deadline) : new Date()
      break
    case 'deal_created':
      baseDate = new Date(deal.created_at)
      break
    default:
      baseDate = new Date()
  }

  const scheduledDate = new Date(baseDate)
  scheduledDate.setDate(scheduledDate.getDate() + offsetDays)
  return scheduledDate
}

/**
 * Start workflows for a deal when it enters escrow
 * Matches workflow definitions by deal.side and trigger_type
 */
export async function startWorkflowsForDeal(dealId: string): Promise<void> {
  // Fetch the deal
  const { data: deal, error: dealError } = await supabaseAdmin
    .from('deals')
    .select('*')
    .eq('id', dealId)
    .single()

  if (dealError || !deal) {
    throw new Error(`Deal not found: ${dealId}`)
  }

  // Only start workflows if deal is in escrow
  if (deal.status !== 'in_escrow') {
    return
  }

  // Find matching workflow definitions
  const { data: workflows, error: workflowsError } = await supabaseAdmin
    .from('workflow_definitions')
    .select('*')
    .eq('side', deal.side)
    .eq('trigger_type', 'in_escrow')
    .eq('is_active', true)

  if (workflowsError) {
    throw new Error(`Failed to fetch workflows: ${workflowsError.message}`)
  }

  if (!workflows || workflows.length === 0) {
    return // No matching workflows
  }

  // Start each matching workflow
  for (const workflow of workflows) {
    await startWorkflow(deal, workflow.id)
  }

  // Log workflow start event
  await logTimelineEvent(dealId, 'workflow_started', {
    message: `Started ${workflows.length} workflow(s) for deal`,
    workflows: workflows.map((w) => w.id),
  })
}

/**
 * Start a specific workflow for a deal
 */
async function startWorkflow(deal: Deal, workflowDefinitionId: string): Promise<void> {
  // Create workflow run
  const { data: workflowRun, error: runError } = await supabaseAdmin
    .from('workflow_runs')
    .insert({
      deal_id: deal.id,
      workflow_definition_id: workflowDefinitionId,
      status: 'active',
    })
    .select()
    .single()

  if (runError || !workflowRun) {
    throw new Error(`Failed to create workflow run: ${runError?.message}`)
  }

  // Fetch workflow steps
  const { data: steps, error: stepsError } = await supabaseAdmin
    .from('workflow_steps')
    .select('*')
    .eq('workflow_definition_id', workflowDefinitionId)
    .order('step_order', { ascending: true })

  if (stepsError || !steps) {
    throw new Error(`Failed to fetch workflow steps: ${stepsError?.message}`)
  }

  // Create workflow run steps with calculated scheduled_for dates
  for (const step of steps) {
    const scheduledFor = calculateScheduledDate(deal, step.relative_to, step.offset_days)

    const { error: runStepError } = await supabaseAdmin
      .from('workflow_run_steps')
      .insert({
        workflow_run_id: workflowRun.id,
        workflow_step_id: step.id,
        scheduled_for: scheduledFor.toISOString(),
        status: 'pending',
      })

    if (runStepError) {
      console.error(`Failed to create workflow run step: ${runStepError.message}`)
    }
  }
}

/**
 * Handle deal events to advance wait_for_event steps
 */
export async function handleDealEvent(event: DealEvent): Promise<void> {
  const { dealId, eventType, data } = event

  // Update deal fields based on event type
  const updateData: Partial<Deal> = {}

  switch (eventType) {
    case 'set-emd-received':
      updateData.emd_received_at = new Date().toISOString()
      break
    case 'set-inspection-deadline':
      if (data?.deadline) {
        updateData.inspection_deadline = new Date(data.deadline as string).toISOString()
      }
      break
    case 'mark-inspection-contingency-removed':
      updateData.inspection_contingency_removed_at = new Date().toISOString()
      break
    case 'set-coe-date':
      if (data?.coe_date) {
        updateData.coe_date = new Date(data.coe_date as string).toISOString()
      }
      break
    case 'status-changed':
      if (data?.status) {
        updateData.status = data.status as Deal['status']
      }
      break
  }

  // Update deal
  if (Object.keys(updateData).length > 0) {
    const { error: updateError } = await supabaseAdmin
      .from('deals')
      .update(updateData)
      .eq('id', dealId)

    if (updateError) {
      throw new Error(`Failed to update deal: ${updateError.message}`)
    }
  }

  // Find and advance wait_for_event steps
  await advanceWaitForEventSteps(dealId, eventType)

  // Log event
  await logTimelineEvent(dealId, 'deal_event', {
    event_type: eventType,
    data,
  })
}

/**
 * Advance wait_for_event steps that are waiting for this event
 */
async function advanceWaitForEventSteps(dealId: string, eventType: string): Promise<void> {
  // Map event types to wait_for_event event_type values
  const eventTypeMap: Record<string, string> = {
    'set-emd-received': 'emd_received',
    'mark-inspection-contingency-removed': 'inspection_contingency_removed',
  }

  const waitEventType = eventTypeMap[eventType]
  if (!waitEventType) {
    return // No matching wait_for_event steps
  }

  // Find active workflow runs for this deal
  const { data: runs, error: runsError } = await supabaseAdmin
    .from('workflow_runs')
    .select('id')
    .eq('deal_id', dealId)
    .eq('status', 'active')

  if (runsError || !runs) {
    return
  }

  const runIds = runs.map((r) => r.id)

  // Find pending workflow run steps that are waiting for this event
  const { data: runSteps, error: stepsError } = await supabaseAdmin
    .from('workflow_run_steps')
    .select(`
      *,
      workflow_steps!inner(*)
    `)
    .in('workflow_run_id', runIds)
    .eq('status', 'pending')

  if (stepsError || !runSteps) {
    return
  }

  // Check each step's auto_config to see if it matches
  for (const runStep of runSteps) {
    const step = (runStep as any).workflow_steps as WorkflowStep
    const config = parseAutoConfig(step.auto_config)

    if (isWaitForEventConfig(config) && config.event_type === waitEventType) {
      // This step is waiting for this event - mark as ready to execute
      // Recalculate scheduled_for date based on current deal state
      const { data: deal } = await supabaseAdmin
        .from('deals')
        .select('*')
        .eq('id', dealId)
        .single()

      if (deal) {
        const newScheduledFor = calculateScheduledDate(deal, step.relative_to, step.offset_days)

        await supabaseAdmin
          .from('workflow_run_steps')
          .update({
            scheduled_for: newScheduledFor.toISOString(),
          })
          .eq('id', runStep.id)
      }
    }
  }
}

/**
 * Execute due workflow steps (called by scheduler)
 */
export async function runDueWorkflowSteps(now: Date = new Date()): Promise<void> {
  // Find all pending workflow run steps that are due
  const { data: runSteps, error: stepsError } = await supabaseAdmin
    .from('workflow_run_steps')
    .select(`
      *,
      workflow_steps!inner(*),
      workflow_runs!inner(
        deal_id,
        workflow_definition_id
      )
    `)
    .eq('status', 'pending')
    .lte('scheduled_for', now.toISOString())

  if (stepsError || !runSteps || runSteps.length === 0) {
    return
  }

  // Execute each due step
  for (const runStep of runSteps) {
    const step = (runStep as any).workflow_steps as WorkflowStep
    const workflowRun = (runStep as any).workflow_runs as WorkflowRun

    try {
      await executeWorkflowStep(runStep as WorkflowRunStep, step, workflowRun.deal_id)
    } catch (error) {
      console.error(`Failed to execute workflow step ${runStep.id}:`, error)
      // Mark step as error
      await supabaseAdmin
        .from('workflow_run_steps')
        .update({
          status: 'error',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          executed_at: new Date().toISOString(),
        })
        .eq('id', runStep.id)
    }
  }
}

/**
 * Execute a single workflow step
 */
async function executeWorkflowStep(
  runStep: WorkflowRunStep,
  step: WorkflowStep,
  dealId: string
): Promise<void> {
  const config = parseAutoConfig(step.auto_config)

  if (!config) {
    throw new Error(`Invalid auto_config for step ${step.id}`)
  }

  // Fetch deal and parties for context
  const { data: deal } = await supabaseAdmin
    .from('deals')
    .select('*')
    .eq('id', dealId)
    .single()

  if (!deal) {
    throw new Error(`Deal not found: ${dealId}`)
  }

  const { data: parties } = await supabaseAdmin
    .from('deal_parties')
    .select('*')
    .eq('deal_id', dealId)

  const context: WorkflowContext = {
    deal,
    parties: parties || [],
    workflowRunId: runStep.id,
  }

  // Execute action based on type
  if (isSendEmailConfig(config)) {
    // Send email using transaction email system
    const { sendTransactionEmail } = await import('@/server/transactionEmails')
    const result = await sendTransactionEmail({
      dealId,
      templateKey: config.template_name,
    })
    
    if (result.sent) {
      console.log(`[Workflow] Sent email: ${config.template_name}`)
    } else if (result.skipped) {
      console.log(`[Workflow] Skipped email: ${config.template_name} - ${result.reason}`)
    } else {
      console.error(`[Workflow] Failed to send email: ${config.template_name} - ${result.error}`)
    }
  } else if (isCreateTaskConfig(config)) {
    await createTask(dealId, config, context)
  } else if (isUpdateFieldConfig(config)) {
    await updateDealField(dealId, config)
  } else if (isWaitForEventConfig(config)) {
    // Wait steps are handled by handleDealEvent - nothing to do here
    return
  }

  // Mark step as completed
  await supabaseAdmin
    .from('workflow_run_steps')
    .update({
      status: 'completed',
      executed_at: new Date().toISOString(),
    })
    .eq('id', runStep.id)

  await logTimelineEvent(dealId, 'step_executed', {
    step_id: step.id,
    step_name: step.name,
    action_type: step.auto_action_type,
  })
}

/**
 * Create a task from workflow step
 */
async function createTask(
  dealId: string,
  config: { title: string; description?: string; due_date_offset_days?: number },
  context: WorkflowContext
): Promise<void> {
  let dueDate: string | null = null

  if (config.due_date_offset_days !== undefined) {
    const due = new Date()
    due.setDate(due.getDate() + config.due_date_offset_days)
    dueDate = due.toISOString()
  }

  const { error } = await supabaseAdmin
    .from('deal_tasks')
    .insert({
      deal_id: dealId,
      title: config.title,
      description: config.description || null,
      due_date: dueDate,
      created_by: null, // System-created
    })

  if (error) {
    throw new Error(`Failed to create task: ${error.message}`)
  }

  await logTimelineEvent(dealId, 'task_created', {
    title: config.title,
  })
}

/**
 * Update a deal field
 */
async function updateDealField(
  dealId: string,
  config: { field: string; value: unknown }
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('deals')
    .update({ [config.field]: config.value })
    .eq('id', dealId)

  if (error) {
    throw new Error(`Failed to update deal field: ${error.message}`)
  }

  await logTimelineEvent(dealId, 'field_updated', {
    field: config.field,
    value: config.value,
  })
}

/**
 * Log timeline event
 */
async function logTimelineEvent(
  dealId: string,
  eventType: string,
  metadata: Record<string, unknown>
): Promise<void> {
  await supabaseAdmin.from('deal_timeline_events').insert({
    deal_id: dealId,
    event_type: eventType,
    description: `${eventType} event`,
    metadata,
    created_by: null, // System-created
  })
}

