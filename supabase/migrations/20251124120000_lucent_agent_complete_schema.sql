-- Lucent Agent: Complete Schema Migration
-- This migration creates the full production-ready schema for Lucent Agent
-- Fresh start approach: drops and recreates deals/deal_parties tables

-- ============================================================================
-- Step 1: Create All Required ENUMs
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Workflow enums
DO $$ BEGIN
  CREATE TYPE workflow_trigger_type AS ENUM ('in_escrow', 'manual', 'deal_created');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE workflow_step_action_type AS ENUM ('send_email', 'create_task', 'update_field', 'wait_for_event');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Deal enums (with all status values)
DO $$ BEGIN
  CREATE TYPE deal_status AS ENUM (
    'draft', 'lead', 'searching', 'under_contract', 'in_escrow', 
    'pending_contingencies', 'pending_coe', 'pending', 'closed', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE deal_side AS ENUM ('buying', 'listing', 'landlord', 'tenant', 'dual');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE party_role AS ENUM ('buyer', 'seller', 'buyer_agent', 'listing_agent', 'lender', 'escrow', 'title');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Property and milestone enums
DO $$ BEGIN
  CREATE TYPE property_type AS ENUM ('sfr', 'condo', 'townhouse', 'multi_unit', 'mixed_use');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE milestone_type AS ENUM ('inspection', 'appraisal', 'loan_contingency', 'hoa_review', 'final_walkthrough', 'closing');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE owner_type AS ENUM ('agent', 'client', 'lender', 'escrow');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE alert_type AS ENUM ('overdue_task', 'missing_doc', 'closing_soon');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE alert_level AS ENUM ('info', 'warning', 'critical');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE role_on_client AS ENUM ('primary', 'co_agent');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============================================================================
-- Step 2: Create Foundation Tables
-- ============================================================================

-- Teams: Multi-tenancy support for brokerages
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Profiles: Extends auth.users with team membership and role
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT NOT NULL DEFAULT 'agent',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Step 3: Drop and Recreate Deals Table (Fresh Start)
-- ============================================================================

-- Drop dependent tables first
DROP TABLE IF EXISTS deal_parties CASCADE;
DROP TABLE IF EXISTS deal_milestones CASCADE;
DROP TABLE IF EXISTS deal_tasks CASCADE;
DROP TABLE IF EXISTS workflow_runs CASCADE;
DROP TABLE IF EXISTS deal_timeline_events CASCADE;
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS doc_packets CASCADE;
DROP TABLE IF EXISTS email_events CASCADE;

-- Drop deals table
DROP TABLE IF EXISTS deals CASCADE;

-- Create deals table with all required columns
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  property_address TEXT NOT NULL,
  property_id UUID REFERENCES properties(id),
  side deal_side NOT NULL,
  status deal_status NOT NULL DEFAULT 'draft',
  price DECIMAL(12, 2),
  loan_type TEXT,
  down_payment_percent DECIMAL(5,2),
  primary_agent_id UUID REFERENCES profiles(id),
  close_date TIMESTAMPTZ,
  emd_amount DECIMAL(12, 2),
  emd_received_at TIMESTAMPTZ,
  inspection_deadline TIMESTAMPTZ,
  inspection_contingency_removed_at TIMESTAMPTZ,
  coe_date TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Step 4: Create Deal Parties Table
-- ============================================================================

CREATE TABLE deal_parties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  role party_role NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Step 5: Create Core Tables
-- ============================================================================

-- Properties: Normalized property data
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  street TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  unit TEXT,
  type property_type,
  mls_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Clients: Long-term CRM contacts
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  preferred_language TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Agent Clients: Junction table linking agents to clients
CREATE TABLE IF NOT EXISTS agent_clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  role_on_client role_on_client NOT NULL DEFAULT 'primary',
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(team_id, agent_id, client_id)
);

-- Deal Milestones: Track key dates in the transaction
CREATE TABLE deal_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  type milestone_type NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notes: Agent notes linked to deals/clients
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  author_profile_id UUID NOT NULL REFERENCES profiles(id),
  body TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Alerts: Deal alerts for overdue tasks, missing docs, closing soon
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  type alert_type NOT NULL,
  level alert_level NOT NULL DEFAULT 'info',
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Step 6: Create Workflow Tables
-- ============================================================================

-- Workflow Definitions: Reusable TC workflow templates
CREATE TABLE IF NOT EXISTS workflow_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  side deal_side NOT NULL,
  trigger_type workflow_trigger_type NOT NULL DEFAULT 'in_escrow',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Workflow Steps: Steps within workflows with scheduling logic
CREATE TABLE IF NOT EXISTS workflow_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_definition_id UUID NOT NULL REFERENCES workflow_definitions(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  relative_to TEXT,
  offset_days INTEGER NOT NULL DEFAULT 0,
  auto_action_type workflow_step_action_type NOT NULL,
  auto_config JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workflow_definition_id, step_order)
);

-- Workflow Runs: Instances of workflows attached to deals
CREATE TABLE workflow_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  workflow_definition_id UUID NOT NULL REFERENCES workflow_definitions(id),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Workflow Run Steps: Execution state of each step per deal
CREATE TABLE workflow_run_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_run_id UUID NOT NULL REFERENCES workflow_runs(id) ON DELETE CASCADE,
  workflow_step_id UUID NOT NULL REFERENCES workflow_steps(id),
  scheduled_for TIMESTAMPTZ NOT NULL,
  executed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Step 7: Create Task and Communication Tables
-- ============================================================================

-- Deal Tasks: Agent action items created by workflows or manually
CREATE TABLE deal_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  owner_type TEXT DEFAULT 'agent' CHECK (owner_type IN ('agent', 'client', 'lender', 'escrow')),
  is_internal BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Email Templates: Handlebars-style templates with placeholders
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  audience TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Email Events: Email delivery tracking
CREATE TABLE email_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  template_id UUID REFERENCES email_templates(id),
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  subject TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'sent',
  external_id TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Deal Timeline Events: Audit log of all deal events
CREATE TABLE deal_timeline_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Step 8: Create Document Tables
-- ============================================================================

-- Doc Packets: Signature envelope containers
CREATE TABLE doc_packets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Doc Packet Documents: Documents in packets
CREATE TABLE doc_packet_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doc_packet_id UUID REFERENCES doc_packets(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  file_url TEXT,
  doc_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Step 9: Create Performance Indexes
-- ============================================================================

-- Foundation indexes
CREATE INDEX IF NOT EXISTS idx_profiles_team_id ON profiles(team_id);

-- Deals indexes
CREATE INDEX IF NOT EXISTS idx_deals_team_id ON deals(team_id);
CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(status);
CREATE INDEX IF NOT EXISTS idx_deals_side ON deals(side);
CREATE INDEX IF NOT EXISTS idx_deals_primary_agent_id ON deals(primary_agent_id) WHERE primary_agent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_deals_property_id ON deals(property_id) WHERE property_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_deals_close_date ON deals(close_date) WHERE close_date IS NOT NULL;

-- Deal Parties indexes
CREATE INDEX IF NOT EXISTS idx_deal_parties_deal_id ON deal_parties(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_parties_client_id ON deal_parties(client_id) WHERE client_id IS NOT NULL;

-- Clients indexes
CREATE INDEX IF NOT EXISTS idx_clients_team_id ON clients(team_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at DESC);

-- Properties indexes
CREATE INDEX IF NOT EXISTS idx_properties_team_id ON properties(team_id);
CREATE INDEX IF NOT EXISTS idx_properties_mls_id ON properties(mls_id) WHERE mls_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_properties_city_state ON properties(city, state);

-- Agent Clients indexes
CREATE INDEX IF NOT EXISTS idx_agent_clients_team_id ON agent_clients(team_id);
CREATE INDEX IF NOT EXISTS idx_agent_clients_agent_id ON agent_clients(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_clients_client_id ON agent_clients(client_id);
CREATE INDEX IF NOT EXISTS idx_agent_clients_primary ON agent_clients(agent_id, is_primary) WHERE is_primary = true;

-- Deal Milestones indexes
CREATE INDEX IF NOT EXISTS idx_deal_milestones_deal_id ON deal_milestones(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_milestones_due_date ON deal_milestones(due_date) WHERE completed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_deal_milestones_type ON deal_milestones(type);

-- Notes indexes
CREATE INDEX IF NOT EXISTS idx_notes_team_id ON notes(team_id);
CREATE INDEX IF NOT EXISTS idx_notes_client_id ON notes(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notes_deal_id ON notes(deal_id) WHERE deal_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);

-- Alerts indexes
CREATE INDEX IF NOT EXISTS idx_alerts_deal_id ON alerts(deal_id);
CREATE INDEX IF NOT EXISTS idx_alerts_is_read ON alerts(is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_alerts_level ON alerts(level);

-- Deal Tasks indexes
CREATE INDEX IF NOT EXISTS idx_deal_tasks_deal_id ON deal_tasks(deal_id) WHERE deal_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_deal_tasks_client_id ON deal_tasks(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_deal_tasks_due_date ON deal_tasks(due_date) WHERE completed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_deal_tasks_owner_type ON deal_tasks(owner_type);

-- Workflow indexes
CREATE INDEX IF NOT EXISTS idx_workflow_steps_definition_id ON workflow_steps(workflow_definition_id);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_deal_id ON workflow_runs(deal_id);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_definition_id ON workflow_runs(workflow_definition_id);
CREATE INDEX IF NOT EXISTS idx_workflow_run_steps_run_id ON workflow_run_steps(workflow_run_id);
CREATE INDEX IF NOT EXISTS idx_workflow_run_steps_scheduled_for ON workflow_run_steps(scheduled_for) WHERE status = 'pending';

-- Email indexes
CREATE INDEX IF NOT EXISTS idx_email_events_deal_id ON email_events(deal_id) WHERE deal_id IS NOT NULL;

-- Timeline indexes
CREATE INDEX IF NOT EXISTS idx_deal_timeline_events_deal_id ON deal_timeline_events(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_timeline_events_created_at ON deal_timeline_events(deal_id, created_at DESC);

-- Doc Packet Documents indexes
CREATE INDEX IF NOT EXISTS idx_doc_packet_documents_deal_id ON doc_packet_documents(deal_id) WHERE deal_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_doc_packet_documents_client_id ON doc_packet_documents(client_id) WHERE client_id IS NOT NULL;

-- ============================================================================
-- Step 10: Create Updated At Trigger Function (Secure)
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- Step 11: Apply Updated At Triggers
-- ============================================================================

DROP TRIGGER IF EXISTS update_teams_updated_at ON teams;
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_deals_updated_at ON deals;
CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_deal_parties_updated_at ON deal_parties;
CREATE TRIGGER update_deal_parties_updated_at BEFORE UPDATE ON deal_parties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_workflow_definitions_updated_at ON workflow_definitions;
CREATE TRIGGER update_workflow_definitions_updated_at BEFORE UPDATE ON workflow_definitions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_workflow_steps_updated_at ON workflow_steps;
CREATE TRIGGER update_workflow_steps_updated_at BEFORE UPDATE ON workflow_steps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_workflow_runs_updated_at ON workflow_runs;
CREATE TRIGGER update_workflow_runs_updated_at BEFORE UPDATE ON workflow_runs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_workflow_run_steps_updated_at ON workflow_run_steps;
CREATE TRIGGER update_workflow_run_steps_updated_at BEFORE UPDATE ON workflow_run_steps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_deal_tasks_updated_at ON deal_tasks;
CREATE TRIGGER update_deal_tasks_updated_at BEFORE UPDATE ON deal_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_email_templates_updated_at ON email_templates;
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_doc_packets_updated_at ON doc_packets;
CREATE TRIGGER update_doc_packets_updated_at BEFORE UPDATE ON doc_packets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Step 12: Enable Row Level Security
-- ============================================================================

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_run_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE doc_packets ENABLE ROW LEVEL SECURITY;
ALTER TABLE doc_packet_documents ENABLE ROW LEVEL SECURITY;

-- Fix existing tables
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_versions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Step 13: Create RLS Policies
-- ============================================================================

-- Teams
DROP POLICY IF EXISTS "Users can view their own team" ON teams;
CREATE POLICY "Users can view their own team" ON teams
  FOR SELECT USING (
    id IN (SELECT team_id FROM profiles WHERE id = auth.uid())
  );

-- Profiles
DROP POLICY IF EXISTS "Users can view profiles in their team" ON profiles;
CREATE POLICY "Users can view profiles in their team" ON profiles
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid())
  );

-- Deals
DROP POLICY IF EXISTS "Users can view deals in their team" ON deals;
CREATE POLICY "Users can view deals in their team" ON deals
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can create deals in their team" ON deals;
CREATE POLICY "Users can create deals in their team" ON deals
  FOR INSERT WITH CHECK (
    team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can update deals in their team" ON deals;
CREATE POLICY "Users can update deals in their team" ON deals
  FOR UPDATE USING (
    team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid())
  );

-- Deal Parties
DROP POLICY IF EXISTS "Users can manage deal parties in their team" ON deal_parties;
CREATE POLICY "Users can manage deal parties in their team" ON deal_parties
  FOR ALL USING (
    deal_id IN (SELECT id FROM deals WHERE team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid()))
  );

-- Clients
DROP POLICY IF EXISTS "Users can view clients in their team" ON clients;
CREATE POLICY "Users can view clients in their team" ON clients
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can create clients in their team" ON clients;
CREATE POLICY "Users can create clients in their team" ON clients
  FOR INSERT WITH CHECK (
    team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can update clients in their team" ON clients;
CREATE POLICY "Users can update clients in their team" ON clients
  FOR UPDATE USING (
    team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid())
  );

-- Properties
DROP POLICY IF EXISTS "Users can manage properties in their team" ON properties;
CREATE POLICY "Users can manage properties in their team" ON properties
  FOR ALL USING (
    team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid())
  );

-- Agent Clients
DROP POLICY IF EXISTS "Users can view agent_clients in their team" ON agent_clients;
CREATE POLICY "Users can view agent_clients in their team" ON agent_clients
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can manage agent_clients in their team" ON agent_clients;
CREATE POLICY "Users can manage agent_clients in their team" ON agent_clients
  FOR ALL USING (
    team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid())
    AND agent_id = auth.uid()
  );

-- Deal Milestones
DROP POLICY IF EXISTS "Users can manage deal milestones in their team" ON deal_milestones;
CREATE POLICY "Users can manage deal milestones in their team" ON deal_milestones
  FOR ALL USING (
    deal_id IN (SELECT id FROM deals WHERE team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid()))
  );

-- Notes
DROP POLICY IF EXISTS "Users can manage notes in their team" ON notes;
CREATE POLICY "Users can manage notes in their team" ON notes
  FOR ALL USING (
    team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid())
  );

-- Alerts
DROP POLICY IF EXISTS "Users can view alerts in their team" ON alerts;
CREATE POLICY "Users can view alerts in their team" ON alerts
  FOR SELECT USING (
    deal_id IN (SELECT id FROM deals WHERE team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid()))
  );

DROP POLICY IF EXISTS "Users can update alerts in their team" ON alerts;
CREATE POLICY "Users can update alerts in their team" ON alerts
  FOR UPDATE USING (
    deal_id IN (SELECT id FROM deals WHERE team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid()))
  );

-- Deal Tasks
DROP POLICY IF EXISTS "Users can manage deal tasks in their team" ON deal_tasks;
CREATE POLICY "Users can manage deal tasks in their team" ON deal_tasks
  FOR ALL USING (
    (deal_id IN (SELECT id FROM deals WHERE team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid())))
    OR (client_id IN (SELECT client_id FROM agent_clients WHERE agent_id = auth.uid()))
  );

-- Workflow Definitions
DROP POLICY IF EXISTS "Users can view workflow definitions" ON workflow_definitions;
CREATE POLICY "Users can view workflow definitions" ON workflow_definitions
  FOR SELECT USING (true);

-- Workflow Runs
DROP POLICY IF EXISTS "Users can view workflow runs in their team" ON workflow_runs;
CREATE POLICY "Users can view workflow runs in their team" ON workflow_runs
  FOR SELECT USING (
    deal_id IN (SELECT id FROM deals WHERE team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid()))
  );

-- Workflow Run Steps
DROP POLICY IF EXISTS "Users can view workflow run steps in their team" ON workflow_run_steps;
CREATE POLICY "Users can view workflow run steps in their team" ON workflow_run_steps
  FOR SELECT USING (
    workflow_run_id IN (
      SELECT id FROM workflow_runs 
      WHERE deal_id IN (SELECT id FROM deals WHERE team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid()))
    )
  );

-- Email Templates
DROP POLICY IF EXISTS "Users can view email templates" ON email_templates;
CREATE POLICY "Users can view email templates" ON email_templates
  FOR SELECT USING (true);

-- Email Events
DROP POLICY IF EXISTS "Users can view email events in their team" ON email_events;
CREATE POLICY "Users can view email events in their team" ON email_events
  FOR SELECT USING (
    deal_id IN (SELECT id FROM deals WHERE team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid()))
    OR deal_id IS NULL
  );

-- Deal Timeline Events
DROP POLICY IF EXISTS "Users can view timeline events in their team" ON deal_timeline_events;
CREATE POLICY "Users can view timeline events in their team" ON deal_timeline_events
  FOR SELECT USING (
    deal_id IN (SELECT id FROM deals WHERE team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid()))
  );

-- Doc Packets
DROP POLICY IF EXISTS "Users can manage doc packets in their team" ON doc_packets;
CREATE POLICY "Users can manage doc packets in their team" ON doc_packets
  FOR ALL USING (
    deal_id IN (SELECT id FROM deals WHERE team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid()))
  );

-- Doc Packet Documents
DROP POLICY IF EXISTS "Users can manage doc packet documents in their team" ON doc_packet_documents;
CREATE POLICY "Users can manage doc packet documents in their team" ON doc_packet_documents
  FOR ALL USING (
    doc_packet_id IN (
      SELECT id FROM doc_packets 
      WHERE deal_id IN (SELECT id FROM deals WHERE team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid()))
    )
    OR deal_id IN (SELECT id FROM deals WHERE team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid()))
    OR client_id IN (SELECT client_id FROM agent_clients WHERE agent_id = auth.uid())
  );

