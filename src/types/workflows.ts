// Workflow engine domain types and API contracts

import type { Deal, DealStatus, DealSide } from './database'

// Deal events that can trigger workflow step progression
export type DealEventType =
  | 'set-emd-received'
  | 'set-inspection-deadline'
  | 'mark-inspection-contingency-removed'
  | 'set-coe-date'
  | 'status-changed'

export interface DealEvent {
  dealId: string
  eventType: DealEventType
  data?: Record<string, unknown>
}

// Workflow context used for step execution
export interface WorkflowContext {
  deal: Deal
  parties: Array<{
    role: string
    name: string
    email: string | null
  }>
  workflowRunId: string
}

// API request/response types for agent endpoints
export interface DashboardResponse {
  activeDeals: Array<{
    id: string
    property_address: string
    side: DealSide
    status: DealStatus
    coe_date: string | null
    health: 'healthy' | 'warning' | 'critical'
  }>
  upcomingTasks: Array<{
    id: string
    deal_id: string
    title: string
    due_date: string | null
    property_address: string
  }>
  overdueTasks: Array<{
    id: string
    deal_id: string
    title: string
    due_date: string
    property_address: string
  }>
}

export interface DealTCResponse {
  deal: Deal
  workflowRuns: Array<{
    id: string
    workflow_definition_id: string
    workflow_name: string
    status: string
    steps: Array<{
      id: string
      step_order: number
      name: string
      scheduled_for: string
      executed_at: string | null
      status: string
    }>
  }>
  tasks: Array<{
    id: string
    title: string
    description: string | null
    due_date: string | null
    completed_at: string | null
  }>
  timeline: Array<{
    id: string
    event_type: string
    description: string
    created_at: string
  }>
}

export interface DealEventRequest {
  eventType: DealEventType
  data?: Record<string, unknown>
}

