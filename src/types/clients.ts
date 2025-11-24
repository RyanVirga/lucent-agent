// Domain types for Agent Clients Portal UI
import type { Deal, DealStatus, DealSide, DealMilestone, DealTask, Note, Alert, DocPacketDocument, Property, Client, PortalInvite } from './database'

export interface ClientWithDeals {
  client: Client
  deals: DealSummary[]
  taskCounts: {
    overdue: number
    upcoming: number
  }
  alertCount: number
  lastActivity: string | null
}

export interface DealSummary {
  deal: Deal
  property: Property | null
  nextMilestone: DealMilestone | null
  status: DealStatus
  side: DealSide
}

export interface ClientDetail {
  client: Client
  primaryDeal: DealSummary | null
  allDeals: DealSummary[]
  property: Property | null
  nextCriticalDate: string | null
  milestones: DealMilestone[]
  alerts: Alert[]
  taskStats: {
    overdue: number
    dueThisWeek: number
    total: number
  }
  portalInvites: PortalInvite[]
}

export type ClientTimelineEvent =
  | { type: 'milestone'; data: DealMilestone; created_at: string }
  | { type: 'task'; data: DealTask; created_at: string }
  | { type: 'note'; data: Note; created_at: string }
  | { type: 'document'; data: DocPacketDocument; created_at: string }

export interface ClientDocument {
  document: DocPacketDocument
  deal: Deal | null
  docType: string | null
  lastUpdated: string
  statusFlags: {
    superseded: boolean
    signatureMissing: boolean
  }
}

export interface ClientTask {
  task: DealTask
  deal: Deal | null
  isOverdue: boolean
  isDueThisWeek: boolean
}

export interface ClientFilters {
  search?: string
  status?: DealStatus[]
  side?: DealSide[]
  closingThisWeek?: boolean
  closingThisMonth?: boolean
}

export interface TimelineFilters {
  eventTypes?: ('milestone' | 'task' | 'note' | 'document')[]
}

export interface CreateTaskInput {
  deal_id: string | null
  client_id: string
  title: string
  description?: string
  due_date: string | null
  owner_type: 'agent' | 'client' | 'lender' | 'escrow'
  is_internal: boolean
}

