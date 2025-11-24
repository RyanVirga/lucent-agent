// Deal TC Detail View API
// Returns full transaction coordination view for a deal

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/server/db/supabaseClient'
import type { DealTCResponse } from '@/types/workflows'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ dealId: string }> }
) {
  try {
    const { dealId } = await params

    // Fetch deal
    const { data: deal, error: dealError } = await supabaseAdmin
      .from('deals')
      .select('*')
      .eq('id', dealId)
      .single()

    if (dealError || !deal) {
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      )
    }

    // Fetch workflow runs with steps
    const { data: workflowRuns, error: runsError } = await supabaseAdmin
      .from('workflow_runs')
      .select(`
        id,
        workflow_definition_id,
        status,
        workflow_definitions(name)
      `)
      .eq('deal_id', dealId)
      .order('started_at', { ascending: false })

    if (runsError) {
      throw new Error(`Failed to fetch workflow runs: ${runsError.message}`)
    }

    // Fetch steps for each workflow run
    const runsWithSteps = await Promise.all(
      (workflowRuns || []).map(async (run: any) => {
        const { data: runSteps, error: stepsError } = await supabaseAdmin
          .from('workflow_run_steps')
          .select(`
            id,
            workflow_step_id,
            scheduled_for,
            executed_at,
            status,
            workflow_steps!inner(step_order, name)
          `)
          .eq('workflow_run_id', run.id)
          .order('scheduled_for', { ascending: true })

        if (stepsError) {
          console.error(`Failed to fetch steps for run ${run.id}:`, stepsError)
          return {
            id: run.id,
            workflow_definition_id: run.workflow_definition_id,
            workflow_name: run.workflow_definitions?.name || 'Unknown',
            status: run.status,
            steps: [],
          }
        }

        return {
          id: run.id,
          workflow_definition_id: run.workflow_definition_id,
          workflow_name: run.workflow_definitions?.name || 'Unknown',
          status: run.status,
          steps: (runSteps || []).map((step: any) => ({
            id: step.id,
            step_order: step.workflow_steps.step_order,
            name: step.workflow_steps.name,
            scheduled_for: step.scheduled_for,
            executed_at: step.executed_at,
            status: step.status,
          })),
        }
      })
    )

    // Fetch tasks
    const { data: tasks, error: tasksError } = await supabaseAdmin
      .from('deal_tasks')
      .select('id, title, description, due_date, completed_at')
      .eq('deal_id', dealId)
      .order('due_date', { ascending: true, nullsFirst: false })

    if (tasksError) {
      throw new Error(`Failed to fetch tasks: ${tasksError.message}`)
    }

    // Fetch timeline events
    const { data: timeline, error: timelineError } = await supabaseAdmin
      .from('deal_timeline_events')
      .select('id, event_type, description, created_at')
      .eq('deal_id', dealId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (timelineError) {
      throw new Error(`Failed to fetch timeline: ${timelineError.message}`)
    }

    const response: DealTCResponse = {
      deal,
      workflowRuns: runsWithSteps,
      tasks: tasks || [],
      timeline: timeline || [],
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Deal TC API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

