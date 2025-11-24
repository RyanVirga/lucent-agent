// Data access functions for clients and deals
import { supabaseAdmin } from './supabaseClient'
import type { ClientFilters, ClientWithDeals, ClientDetail, DealSummary } from '@/types/clients'
import type { Deal, DealStatus, Property, DealMilestone, Alert, DealTask } from '@/types/database'

const SCHEMA_MISSING_CODE = 'PGRST205'

const isSchemaMissingError = (error: unknown): boolean => {
  return Boolean(
    error &&
    typeof error === 'object' &&
    'code' in error &&
    (error as { code?: string }).code === SCHEMA_MISSING_CODE
  )
}

/**
 * Fetch all clients for an agent with their deals, filtered by criteria
 */
export async function fetchAgentClientsWithDeals(
  teamId: string,
  agentId: string,
  filters?: ClientFilters
): Promise<ClientWithDeals[]> {
  // Build query for clients linked to this agent via agent_clients
  let query = supabaseAdmin
    .from('agent_clients')
    .select(`
      client_id,
      clients (
        id,
        team_id,
        first_name,
        last_name,
        email,
        phone,
        preferred_language,
        created_at
      )
    `)
    .eq('team_id', teamId)
    .eq('agent_id', agentId)

  const { data: agentClients, error: acError } = await query

  if (acError) {
    if (isSchemaMissingError(acError)) {
      console.warn('Supabase schema missing agent_clients table - returning empty client list')
      return []
    }

    throw new Error(`Failed to fetch agent clients: ${acError.message}`)
  }

  if (!agentClients || agentClients.length === 0) {
    return []
  }

  const clientIds = agentClients.map((ac: any) => ac.client_id)

  // Fetch deals for these clients
  let dealsQuery = supabaseAdmin
    .from('deals')
    .select(`
      *,
      properties (*),
      deal_milestones (*),
      deal_tasks (*),
      alerts (*)
    `)
    .in('primary_agent_id', [agentId])
    .or(`client_id.in.(${clientIds.join(',')})`)

  // Apply filters
  if (filters?.status && filters.status.length > 0) {
    dealsQuery = dealsQuery.in('status', filters.status)
  }

  if (filters?.side && filters.side.length > 0) {
    dealsQuery = dealsQuery.in('side', filters.side)
  }

  if (filters?.closingThisWeek) {
    const now = new Date()
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    dealsQuery = dealsQuery
      .not('close_date', 'is', null)
      .gte('close_date', now.toISOString())
      .lte('close_date', nextWeek.toISOString())
  }

  if (filters?.closingThisMonth) {
    const now = new Date()
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    dealsQuery = dealsQuery
      .not('close_date', 'is', null)
      .gte('close_date', now.toISOString())
      .lte('close_date', nextMonth.toISOString())
  }

  const { data: dealsData, error: dealsError } = await dealsQuery

  if (dealsError) {
    if (isSchemaMissingError(dealsError)) {
      console.warn('Supabase schema missing deals table - returning empty client list')
      return []
    }

    throw new Error(`Failed to fetch deals: ${dealsError.message}`)
  }

  // Also fetch deals via deal_parties.client_id
  const { data: dealsViaPartiesData, error: partiesError } = await supabaseAdmin
    .from('deal_parties')
    .select(`
      deal_id,
      client_id,
      deals (
        *,
        properties (*),
        deal_milestones (*),
        deal_tasks (*),
        alerts (*)
      )
    `)
    .in('client_id', clientIds)

  if (partiesError) {
    if (isSchemaMissingError(partiesError)) {
      console.warn('Supabase schema missing deal_parties table - continuing without related deals')
    } else {
      throw new Error(`Failed to fetch deals via parties: ${partiesError.message}`)
    }
  }

  // Combine and process results
  const allDeals = [
    ...(dealsData || []),
    ...((dealsViaPartiesData || []).map((dp: any) => dp.deals).filter(Boolean) || []),
  ]

  // Group deals by client and build ClientWithDeals objects
  const clientsMap = new Map<string, ClientWithDeals>()

  for (const ac of agentClients) {
    const client = ac.clients
    if (!client) continue

    const clientDeals = allDeals.filter((deal: any) => {
      // Match by primary_agent_id or deal_parties.client_id
      return deal.primary_agent_id === agentId || 
             (deal.deal_parties && deal.deal_parties.some((dp: any) => dp.client_id === client.id))
    })

    // Build deal summaries
    const dealSummaries: DealSummary[] = clientDeals.map((deal: any) => ({
      deal: deal as Deal,
      property: deal.properties as Property | null,
      nextMilestone: (deal.deal_milestones || [])
        .filter((m: DealMilestone) => !m.completed_at)
        .sort((a: DealMilestone, b: DealMilestone) => 
          new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        )[0] || null,
      status: deal.status as DealStatus,
      side: deal.side,
    }))

    // Calculate task counts
    const allTasks = clientDeals.flatMap((deal: any) => deal.deal_tasks || [])
    const now = new Date()
    const overdue = allTasks.filter((task: DealTask) => 
      task.due_date && !task.completed_at && new Date(task.due_date) < now
    ).length
    const upcoming = allTasks.filter((task: DealTask) =>
      task.due_date && !task.completed_at && new Date(task.due_date) >= now
    ).length

    // Count alerts
    const alertCount = clientDeals.reduce((sum: number, deal: any) => 
      sum + ((deal.alerts || []).filter((a: Alert) => !a.is_read).length), 0
    )

    // Find last activity
    const allActivities = [
      ...allTasks.map((t: DealTask) => t.updated_at || t.created_at),
      ...clientDeals.map((d: any) => d.updated_at),
    ].filter(Boolean).sort().reverse()
    const lastActivity = allActivities[0] || null

    clientsMap.set(client.id, {
      client: client as any,
      deals: dealSummaries,
      taskCounts: { overdue, upcoming },
      alertCount,
      lastActivity,
    })
  }

  // Apply search filter if provided
  let results = Array.from(clientsMap.values())
  
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase()
    results = results.filter((cw) => {
      const client = cw.client
      const searchable = [
        `${client.first_name} ${client.last_name}`,
        client.email,
        ...cw.deals.map(d => d.property?.street || d.deal.property_address || ''),
        ...cw.deals.map(d => d.property?.mls_id || ''),
      ].filter(Boolean).join(' ').toLowerCase()
      
      return searchable.includes(searchLower)
    })
  }

  return results
}

/**
 * Fetch full client detail with all related data
 */
export async function fetchClientDetail(
  teamId: string,
  agentId: string,
  clientId: string
): Promise<ClientDetail> {
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

  // Fetch client with portal invites
  const { data: client, error: clientError } = await supabaseAdmin
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single()

  if (clientError || !client) {
    throw new Error('Client not found')
  }

  // Fetch portal invites
  const { data: portalInvites } = await supabaseAdmin
    .from('portal_invites')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  // Fetch all deals for this client
  const { data: deals, error: dealsError } = await supabaseAdmin
    .from('deals')
    .select(`
      *,
      properties (*),
      deal_milestones (*),
      alerts (*)
    `)
    .or(`primary_agent_id.eq.${agentId},id.in.(
      SELECT deal_id FROM deal_parties WHERE client_id.eq.${clientId}
    )`)
    .eq('team_id', teamId)

  if (dealsError) {
    throw new Error(`Failed to fetch deals: ${dealsError.message}`)
  }

  // Find primary deal (most recent active deal)
  const primaryDeal = deals?.[0] || null
  const primaryProperty = primaryDeal?.properties || null

  // Build deal summaries
  const allDeals: DealSummary[] = (deals || []).map((deal: any) => ({
    deal: deal as Deal,
    property: deal.properties as Property | null,
    nextMilestone: (deal.deal_milestones || [])
      .filter((m: DealMilestone) => !m.completed_at)
      .sort((a: DealMilestone, b: DealMilestone) => 
        new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      )[0] || null,
    status: deal.status as DealStatus,
    side: deal.side,
  }))

  const primaryDealSummary = allDeals[0] || null

  // Fetch all milestones
  const allMilestones = (deals || []).flatMap((deal: any) => deal.deal_milestones || [])

  // Fetch all alerts
  const allAlerts = (deals || []).flatMap((deal: any) => deal.alerts || [])

  // Fetch tasks
  const { data: tasks, error: tasksError } = await supabaseAdmin
    .from('deal_tasks')
    .select('*')
    .eq('client_id', clientId)
    .or(`deal_id.in.(${(deals || []).map((d: any) => d.id).join(',')})`)

  if (tasksError) {
    throw new Error(`Failed to fetch tasks: ${tasksError.message}`)
  }

  // Calculate task stats
  const now = new Date()
  const overdue = (tasks || []).filter((t: DealTask) => 
    t.due_date && !t.completed_at && new Date(t.due_date) < now
  ).length
  const dueThisWeek = (tasks || []).filter((t: DealTask) => {
    if (!t.due_date || t.completed_at) return false
    const dueDate = new Date(t.due_date)
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    return dueDate >= now && dueDate <= weekFromNow
  }).length

  // Find next critical date (milestone or close date)
  const nextMilestone = allMilestones
    .filter((m: DealMilestone) => !m.completed_at)
    .sort((a: DealMilestone, b: DealMilestone) => 
      new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
    )[0]

  const nextCriticalDate = nextMilestone?.due_date || primaryDeal?.close_date || null

  return {
    client: client as any,
    primaryDeal: primaryDealSummary,
    allDeals,
    property: primaryProperty as Property | null,
    nextCriticalDate,
    milestones: allMilestones as DealMilestone[],
    alerts: allAlerts as Alert[],
    taskStats: {
      overdue,
      dueThisWeek,
      total: tasks?.length || 0,
    },
    portalInvites: (portalInvites || []) as any[],
  }
}

/**
 * Update deal status with validation
 */
export async function updateDealStatus(
  teamId: string,
  agentId: string,
  dealId: string,
  status: DealStatus
): Promise<void> {
  // Verify agent has access to this deal
  const { data: deal, error: dealError } = await supabaseAdmin
    .from('deals')
    .select('*')
    .eq('id', dealId)
    .eq('team_id', teamId)
    .eq('primary_agent_id', agentId)
    .single()

  if (dealError || !deal) {
    throw new Error('Deal not found or access denied')
  }

  // Update status
  const { error: updateError } = await supabaseAdmin
    .from('deals')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', dealId)

  if (updateError) {
    throw new Error(`Failed to update deal status: ${updateError.message}`)
  }
}

