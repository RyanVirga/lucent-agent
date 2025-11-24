// Data access functions for client tasks
import { supabaseAdmin } from './supabaseClient'
import type { ClientTask, CreateTaskInput } from '@/types/clients'
import type { DealTask, Deal } from '@/types/database'

/**
 * Fetch tasks for a client, grouped by status
 */
export async function fetchClientTasks(
  teamId: string,
  agentId: string,
  clientId: string
): Promise<{
  overdue: ClientTask[]
  dueThisWeek: ClientTask[]
  later: ClientTask[]
}> {
  // Verify agent has access to this client
  const { data: agentClient, error: acError } = await supabaseAdmin
    .from('agent_clients')
    .select('*')
    .eq('team_id', teamId)
    .eq('agent_id', agentId)
    .eq('client_id', clientId)
    .single()

  if (acError || !agentClient) {
    throw new Error('Client not found or access denied')
  }

  // Fetch all deals for this client
  const { data: deals, error: dealsError } = await supabaseAdmin
    .from('deals')
    .select('id')
    .or(`primary_agent_id.eq.${agentId},id.in.(
      SELECT deal_id FROM deal_parties WHERE client_id.eq.${clientId}
    )`)
    .eq('team_id', teamId)

  if (dealsError) {
    throw new Error(`Failed to fetch deals: ${dealsError.message}`)
  }

  const dealIds = (deals || []).map((d: any) => d.id)

  // Fetch tasks
  const { data: tasks, error: tasksError } = await supabaseAdmin
    .from('deal_tasks')
    .select('*')
    .or(`client_id.eq.${clientId},deal_id.in.(${dealIds.length > 0 ? dealIds.join(',') : 'null'})`)
    .is('completed_at', null)
    .order('due_date', { ascending: true })

  if (tasksError) {
    throw new Error(`Failed to fetch tasks: ${tasksError.message}`)
  }

  const now = new Date()
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  // Fetch deal info for each task
  const tasksWithDeals: ClientTask[] = await Promise.all(
    (tasks || []).map(async (task: DealTask) => {
      let deal: Deal | null = null
      
      if (task.deal_id) {
        const { data: dealData } = await supabaseAdmin
          .from('deals')
          .select('*')
          .eq('id', task.deal_id)
          .single()
        
        deal = dealData as Deal | null
      }

      const dueDate = task.due_date ? new Date(task.due_date) : null
      const isOverdue = dueDate ? dueDate < now : false
      const isDueThisWeek = dueDate ? dueDate >= now && dueDate <= weekFromNow : false

      return {
        task,
        deal,
        isOverdue,
        isDueThisWeek,
      }
    })
  )

  // Group tasks
  const overdue = tasksWithDeals.filter(t => t.isOverdue)
  const dueThisWeek = tasksWithDeals.filter(t => t.isDueThisWeek && !t.isOverdue)
  const later = tasksWithDeals.filter(t => !t.isOverdue && !t.isDueThisWeek)

  return {
    overdue,
    dueThisWeek,
    later,
  }
}

/**
 * Create a new task for a client
 */
export async function createClientTask(
  teamId: string,
  agentId: string,
  taskInput: CreateTaskInput
): Promise<DealTask> {
  // Verify agent has access to this client
  const { data: agentClient, error: acError } = await supabaseAdmin
    .from('agent_clients')
    .select('*')
    .eq('team_id', teamId)
    .eq('agent_id', agentId)
    .eq('client_id', taskInput.client_id)
    .single()

  if (acError || !agentClient) {
    throw new Error('Client not found or access denied')
  }

  // If deal_id is provided, verify it belongs to the agent
  if (taskInput.deal_id) {
    const { data: deal, error: dealError } = await supabaseAdmin
      .from('deals')
      .select('*')
      .eq('id', taskInput.deal_id)
      .eq('team_id', teamId)
      .eq('primary_agent_id', agentId)
      .single()

    if (dealError || !deal) {
      throw new Error('Deal not found or access denied')
    }
  }

  // Create task
  const { data: task, error: taskError } = await supabaseAdmin
    .from('deal_tasks')
    .insert({
      deal_id: taskInput.deal_id,
      client_id: taskInput.client_id,
      title: taskInput.title,
      description: taskInput.description || null,
      due_date: taskInput.due_date || null,
      owner_type: taskInput.owner_type,
      is_internal: taskInput.is_internal,
      created_by: agentId,
    })
    .select()
    .single()

  if (taskError || !task) {
    throw new Error(`Failed to create task: ${taskError?.message || 'Unknown error'}`)
  }

  return task as DealTask
}

/**
 * Update task completion status
 */
export async function updateTaskStatus(
  teamId: string,
  agentId: string,
  taskId: string,
  completed: boolean
): Promise<void> {
  // Verify agent has access to this task
  const { data: task, error: taskError } = await supabaseAdmin
    .from('deal_tasks')
    .select(`
      *,
      deals!inner(team_id, primary_agent_id),
      clients!inner(id)
    `)
    .eq('id', taskId)
    .single()

  if (taskError || !task) {
    throw new Error('Task not found')
  }

  // Verify access via deal or client
  const deal = (task as any).deals
  const client = (task as any).clients

  if (deal && deal.team_id !== teamId) {
    throw new Error('Access denied')
  }

  if (deal && deal.primary_agent_id !== agentId) {
    // Check if agent has access via agent_clients
    if (client) {
      const { data: ac } = await supabaseAdmin
        .from('agent_clients')
        .select('*')
        .eq('team_id', teamId)
        .eq('agent_id', agentId)
        .eq('client_id', client.id)
        .single()

      if (!ac) {
        throw new Error('Access denied')
      }
    } else {
      throw new Error('Access denied')
    }
  }

  // Update task
  const { error: updateError } = await supabaseAdmin
    .from('deal_tasks')
    .update({
      completed_at: completed ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId)

  if (updateError) {
    throw new Error(`Failed to update task: ${updateError.message}`)
  }
}

