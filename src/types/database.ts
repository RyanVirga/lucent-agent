// Database table type definitions matching Supabase schema
// These types can be regenerated using Supabase CLI: supabase gen types typescript

export type WorkflowTriggerType = 'in_escrow' | 'manual' | 'deal_created'
export type WorkflowStepActionType = 'send_email' | 'create_task' | 'update_field' | 'wait_for_event'
export type DealStatus = 'draft' | 'lead' | 'searching' | 'under_contract' | 'in_escrow' | 'pending_contingencies' | 'pending' | 'pending_coe' | 'closed' | 'cancelled' | 'pre_approval' | 'offer' | 'pre_listing' | 'active' | 'offer_review'
export type DealSide = 'buying' | 'listing' | 'landlord' | 'tenant' | 'dual'
export type PartyRole = 'buyer' | 'seller' | 'buyer_agent' | 'listing_agent' | 'lender' | 'escrow' | 'title'
export type PropertyType = 'sfr' | 'condo' | 'townhouse' | 'multi_unit' | 'mixed_use'
export type MilestoneType = 'inspection' | 'appraisal' | 'loan_contingency' | 'hoa_review' | 'final_walkthrough' | 'closing'
export type OwnerType = 'agent' | 'client' | 'lender' | 'escrow'
export type AlertType = 'overdue_task' | 'missing_doc' | 'closing_soon'
export type AlertLevel = 'info' | 'warning' | 'critical'
export type RoleOnClient = 'primary' | 'co_agent'

export interface Team {
  id: string
  name: string
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  team_id: string
  email: string
  first_name: string | null
  last_name: string | null
  role: string
  created_at: string
  updated_at: string
}

export interface Deal {
  id: string
  team_id: string
  property_address: string
  property_id: string | null
  side: DealSide
  status: DealStatus
  price: number | null
  loan_type: string | null
  down_payment_percent: number | null
  close_date: string | null
  primary_agent_id: string | null
  emd_amount: number | null
  emd_received_at: string | null
  inspection_deadline: string | null
  inspection_contingency_removed_at: string | null
  coe_date: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  mls_url: string | null
  target_date: string | null
  // Transaction-specific fields
  escrow_company_id: string | null
  lender_id: string | null
  has_hoa: boolean
  has_solar: boolean
  tc_fee_amount: number | null
  tc_fee_payer: 'seller' | 'buyer' | 'other' | null
  offer_acceptance_date: string | null
  emd_due_date: string | null
  seller_disclosures_due_date: string | null
  buyer_investigation_due_date: string | null
  buyer_appraisal_due_date: string | null
  buyer_loan_due_date: string | null
  buyer_insurance_due_date: string | null
  estimated_coe_date: string | null
  possession_date: string | null
  inspection_scheduled_at: string | null
  appraisal_ordered_at: string | null
  hoa_docs_received_at: string | null
  seller_disclosures_sent_at: string | null
  buyer_disclosures_signed_at: string | null
  cda_prepared_at: string | null
  cda_sent_to_escrow_at: string | null
  closed_at: string | null
}

export interface DealParty {
  id: string
  deal_id: string
  client_id: string | null
  role: PartyRole
  name: string
  email: string | null
  phone: string | null
  created_at: string
  updated_at: string
}

export interface WorkflowDefinition {
  id: string
  name: string
  description: string | null
  side: DealSide
  trigger_type: WorkflowTriggerType
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface WorkflowStep {
  id: string
  workflow_definition_id: string
  step_order: number
  name: string
  description: string | null
  relative_to: string | null
  offset_days: number
  auto_action_type: WorkflowStepActionType
  auto_config: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface WorkflowRun {
  id: string
  deal_id: string
  workflow_definition_id: string
  started_at: string
  completed_at: string | null
  status: string
  created_at: string
  updated_at: string
}

export interface WorkflowRunStep {
  id: string
  workflow_run_id: string
  workflow_step_id: string
  scheduled_for: string
  executed_at: string | null
  status: string
  error_message: string | null
  created_at: string
  updated_at: string
}

export interface DealTask {
  id: string
  deal_id: string
  client_id: string | null
  assigned_to: string | null
  title: string
  description: string | null
  due_date: string | null
  completed_at: string | null
  created_by: string | null
  owner_type: string
  is_internal: boolean
  created_at: string
  updated_at: string
}

export type AudienceType = 'escrow' | 'lender' | 'listing_agent' | 'buying_agent' | 'all_parties' | 'seller' | 'buyer' | 'internal_chat'

export interface EmailTemplate {
  id: string
  name: string
  key: string
  subject_template: string
  body_html: string
  body_text: string | null
  audience_type: AudienceType | null
  side: DealSide | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface EmailEvent {
  id: string
  deal_id: string | null
  template_id: string | null
  recipient_email: string
  recipient_name: string | null
  subject: string
  sent_at: string
  status: string
  external_id: string | null
  error_message: string | null
  created_at: string
}

export interface DealTimelineEvent {
  id: string
  deal_id: string
  event_type: string
  description: string
  metadata: Record<string, unknown> | null
  created_by: string | null
  created_at: string
}

export interface DocPacket {
  id: string
  deal_id: string
  name: string
  status: string
  created_at: string
  updated_at: string
}

export interface DocPacketDocument {
  id: string
  doc_packet_id: string
  deal_id: string | null
  client_id: string | null
  name: string
  file_url: string | null
  doc_type: string | null
  created_at: string
}

// ============================================================================
// New Tables for Agent Clients Portal
// ============================================================================

export interface Client {
  id: string
  team_id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  preferred_language: string | null
  type: 'buyer' | 'seller' | 'both' | null
  preferred_contact_method: 'email' | 'text' | 'phone' | null
  co_client_name: string | null
  co_client_email: string | null
  notes: string | null
  created_at: string
}

export interface Property {
  id: string
  team_id: string
  street: string
  city: string
  state: string
  postal_code: string
  unit: string | null
  type: PropertyType | null
  mls_id: string | null
  created_at: string
}

export interface AgentClient {
  id: string
  team_id: string
  agent_id: string
  client_id: string
  role_on_client: RoleOnClient
  is_primary: boolean
  created_at: string
}

export interface DealMilestone {
  id: string
  deal_id: string
  type: MilestoneType
  due_date: string
  completed_at: string | null
  created_at: string
}

export interface Note {
  id: string
  team_id: string
  client_id: string | null
  deal_id: string | null
  author_profile_id: string
  body: string
  is_internal: boolean
  created_at: string
}

export interface Alert {
  id: string
  deal_id: string
  type: AlertType
  level: AlertLevel
  message: string
  is_read: boolean
  created_at: string
}

// ============================================================================
// Transaction Email Automation Tables
// ============================================================================

export interface EscrowCompany {
  id: string
  team_id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  contact_person: string | null
  created_at: string
  updated_at: string
}

export interface Lender {
  id: string
  team_id: string
  name: string
  email: string | null
  phone: string | null
  loan_officer_name: string | null
  created_at: string
  updated_at: string
}

export interface TransactionEmailLog {
  id: string
  deal_id: string
  template_key: string
  sent_at: string
  context_date: string | null
  status: 'sent' | 'failed' | 'pending'
  error_message: string | null
  recipient_emails: string[] | null
  created_at: string
}

export interface PortalInvite {
  id: string
  client_id: string
  email: string
  status: 'pending' | 'sent' | 'accepted'
  created_at: string
  updated_at: string
}

