// Data access functions for client timeline
import { supabaseAdmin } from './supabaseClient'
import type { ClientTimelineEvent, TimelineFilters } from '@/types/clients'
import type { DealMilestone, DealTask, Note, DocPacketDocument } from '@/types/database'

/**
 * Fetch chronological timeline of events for a client
 */
export async function fetchClientTimeline(
  teamId: string,
  agentId: string,
  clientId: string,
  filters?: TimelineFilters
): Promise<ClientTimelineEvent[]> {
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

  if (dealIds.length === 0) {
    return []
  }

  const events: ClientTimelineEvent[] = []

  // Fetch milestones
  if (!filters?.eventTypes || filters.eventTypes.includes('milestone')) {
    const { data: milestones, error: milestonesError } = await supabaseAdmin
      .from('deal_milestones')
      .select('*')
      .in('deal_id', dealIds)
      .order('created_at', { ascending: false })

    if (!milestonesError && milestones) {
      events.push(...milestones.map((m: DealMilestone) => ({
        type: 'milestone' as const,
        data: m,
        created_at: m.created_at,
      })))
    }
  }

  // Fetch tasks
  if (!filters?.eventTypes || filters.eventTypes.includes('task')) {
    const { data: tasks, error: tasksError } = await supabaseAdmin
      .from('deal_tasks')
      .select('*')
      .or(`client_id.eq.${clientId},deal_id.in.(${dealIds.join(',')})`)
      .order('created_at', { ascending: false })

    if (!tasksError && tasks) {
      events.push(...tasks.map((t: DealTask) => ({
        type: 'task' as const,
        data: t,
        created_at: t.created_at,
      })))
    }
  }

  // Fetch notes
  if (!filters?.eventTypes || filters.eventTypes.includes('note')) {
    const { data: notes, error: notesError } = await supabaseAdmin
      .from('notes')
      .select('*')
      .eq('team_id', teamId)
      .or(`client_id.eq.${clientId},deal_id.in.(${dealIds.join(',')})`)
      .order('created_at', { ascending: false })

    if (!notesError && notes) {
      events.push(...notes.map((n: Note) => ({
        type: 'note' as const,
        data: n,
        created_at: n.created_at,
      })))
    }
  }

  // Fetch documents
  if (!filters?.eventTypes || filters.eventTypes.includes('document')) {
    const { data: documents, error: docsError } = await supabaseAdmin
      .from('doc_packet_documents')
      .select('*')
      .or(`client_id.eq.${clientId},deal_id.in.(${dealIds.join(',')})`)
      .order('created_at', { ascending: false })

    if (!docsError && documents) {
      events.push(...documents.map((d: DocPacketDocument) => ({
        type: 'document' as const,
        data: d,
        created_at: d.created_at,
      })))
    }
  }

  // Sort all events by created_at descending
  events.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return events
}

