-- Lucent Agent TC Workflows Schema Migration
-- This migration creates the core database schema for transaction coordination workflows

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums for workflow system
CREATE TYPE workflow_trigger_type AS ENUM ('in_escrow', 'manual', 'deal_created');
CREATE TYPE workflow_step_action_type AS ENUM ('send_email', 'create_task', 'update_field', 'wait_for_event');
CREATE TYPE deal_status AS ENUM ('draft', 'in_escrow', 'pending_contingencies', 'pending_coe', 'closed', 'cancelled');
CREATE TYPE deal_side AS ENUM ('buying', 'listing');
CREATE TYPE party_role AS ENUM ('buyer', 'seller', 'buyer_agent', 'listing_agent', 'lender', 'escrow', 'title');

-- ============================================================================
-- Core Tables
-- ============================================================================

-- Teams: Multi-tenancy support for brokerages
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Profiles: Extends auth.users with team membership and role
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT NOT NULL DEFAULT 'agent', -- agent, admin, coordinator
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Deals: Main transaction table with TC fields
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  property_address TEXT NOT NULL,
  side deal_side NOT NULL, -- buying or listing
  status deal_status NOT NULL DEFAULT 'draft',
  
  -- TC-specific fields
  emd_amount DECIMAL(12, 2),
  emd_received_at TIMESTAMPTZ,
  inspection_deadline TIMESTAMPTZ,
  inspection_contingency_removed_at TIMESTAMPTZ,
  coe_date TIMESTAMPTZ, -- Close of Escrow date
  
  -- Metadata
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Deal Parties: Contacts associated with deals (clients, lender, escrow, agents)
CREATE TABLE deal_parties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  role party_role NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Workflow Tables
-- ============================================================================

-- Workflow Definitions: Reusable TC workflow templates
CREATE TABLE workflow_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  side deal_side NOT NULL, -- buying or listing side workflow
  trigger_type workflow_trigger_type NOT NULL DEFAULT 'in_escrow',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Workflow Steps: Steps within workflows with scheduling logic
CREATE TABLE workflow_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_definition_id UUID NOT NULL REFERENCES workflow_definitions(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Scheduling: relative to deal dates (COE, inspection_deadline, etc.)
  relative_to TEXT, -- 'coe_date', 'inspection_deadline', 'deal_created', etc.
  offset_days INTEGER NOT NULL DEFAULT 0, -- days before/after relative_to date
  
  -- Action configuration
  auto_action_type workflow_step_action_type NOT NULL,
  auto_config JSONB, -- Flexible config: template_name, task details, field updates, event to wait for
  
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
  status TEXT NOT NULL DEFAULT 'active', -- active, completed, cancelled
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
  status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, skipped, error
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Task and Communication Tables
-- ============================================================================

-- Deal Tasks: Agent action items created by workflows or manually
CREATE TABLE deal_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Email Templates: Handlebars-style templates with placeholders
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  audience TEXT, -- 'buyer', 'seller', 'lender', 'escrow', etc.
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
  status TEXT NOT NULL DEFAULT 'sent', -- sent, delivered, bounced, failed
  external_id TEXT, -- Resend message ID
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Deal Timeline Events: Audit log of all deal events
CREATE TABLE deal_timeline_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'workflow_started', 'step_executed', 'task_created', 'email_sent', 'field_updated', etc.
  description TEXT NOT NULL,
  metadata JSONB, -- Additional context
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Document Tables (Stubbed for Future)
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
  doc_packet_id UUID NOT NULL REFERENCES doc_packets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Indexes
-- ============================================================================

-- Foreign key indexes
CREATE INDEX idx_profiles_team_id ON profiles(team_id);
CREATE INDEX idx_deals_team_id ON deals(team_id);
CREATE INDEX idx_deals_status ON deals(status);
CREATE INDEX idx_deal_parties_deal_id ON deal_parties(deal_id);
CREATE INDEX idx_workflow_steps_definition_id ON workflow_steps(workflow_definition_id);
CREATE INDEX idx_workflow_runs_deal_id ON workflow_runs(deal_id);
CREATE INDEX idx_workflow_runs_definition_id ON workflow_runs(workflow_definition_id);
CREATE INDEX idx_workflow_run_steps_run_id ON workflow_run_steps(workflow_run_id);
CREATE INDEX idx_workflow_run_steps_scheduled_for ON workflow_run_steps(scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_deal_tasks_deal_id ON deal_tasks(deal_id);
CREATE INDEX idx_deal_tasks_due_date ON deal_tasks(due_date) WHERE completed_at IS NULL;
CREATE INDEX idx_email_events_deal_id ON email_events(deal_id);
CREATE INDEX idx_deal_timeline_events_deal_id ON deal_timeline_events(deal_id);
CREATE INDEX idx_deal_timeline_events_created_at ON deal_timeline_events(deal_id, created_at DESC);

-- ============================================================================
-- Triggers
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all tables with updated_at column
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_deal_parties_updated_at BEFORE UPDATE ON deal_parties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workflow_definitions_updated_at BEFORE UPDATE ON workflow_definitions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workflow_steps_updated_at BEFORE UPDATE ON workflow_steps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workflow_runs_updated_at BEFORE UPDATE ON workflow_runs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workflow_run_steps_updated_at BEFORE UPDATE ON workflow_run_steps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_deal_tasks_updated_at BEFORE UPDATE ON deal_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_doc_packets_updated_at BEFORE UPDATE ON doc_packets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_run_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE doc_packets ENABLE ROW LEVEL SECURITY;
ALTER TABLE doc_packet_documents ENABLE ROW LEVEL SECURITY;

-- Team-scoped access policies
-- Note: These policies assume authenticated users have a profile with team_id
-- In production, you'll need to create policies that check auth.uid() against profiles table

-- Teams: Users can only see their own team
CREATE POLICY "Users can view their own team" ON teams
  FOR SELECT USING (
    id IN (SELECT team_id FROM profiles WHERE id = auth.uid())
  );

-- Profiles: Users can view profiles in their team
CREATE POLICY "Users can view profiles in their team" ON profiles
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid())
  );

-- Deals: Users can view deals in their team
CREATE POLICY "Users can view deals in their team" ON deals
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can create deals in their team" ON deals
  FOR INSERT WITH CHECK (
    team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can update deals in their team" ON deals
  FOR UPDATE USING (
    team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid())
  );

-- Deal Parties: Users can manage parties for deals in their team
CREATE POLICY "Users can manage deal parties in their team" ON deal_parties
  FOR ALL USING (
    deal_id IN (SELECT id FROM deals WHERE team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid()))
  );

-- Workflow Definitions: Team-scoped (or global if shared)
CREATE POLICY "Users can view workflow definitions" ON workflow_definitions
  FOR SELECT USING (true); -- Can be made team-scoped if needed

-- Workflow Runs: Users can view runs for deals in their team
CREATE POLICY "Users can view workflow runs in their team" ON workflow_runs
  FOR SELECT USING (
    deal_id IN (SELECT id FROM deals WHERE team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid()))
  );

-- Workflow Run Steps: Users can view steps for runs in their team
CREATE POLICY "Users can view workflow run steps in their team" ON workflow_run_steps
  FOR SELECT USING (
    workflow_run_id IN (
      SELECT id FROM workflow_runs 
      WHERE deal_id IN (SELECT id FROM deals WHERE team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid()))
    )
  );

-- Deal Tasks: Users can manage tasks for deals in their team
CREATE POLICY "Users can manage deal tasks in their team" ON deal_tasks
  FOR ALL USING (
    deal_id IN (SELECT id FROM deals WHERE team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid()))
  );

-- Email Templates: Read-only for all authenticated users
CREATE POLICY "Users can view email templates" ON email_templates
  FOR SELECT USING (true);

-- Email Events: Users can view email events for deals in their team
CREATE POLICY "Users can view email events in their team" ON email_events
  FOR SELECT USING (
    deal_id IN (SELECT id FROM deals WHERE team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid()))
    OR deal_id IS NULL
  );

-- Deal Timeline Events: Users can view timeline for deals in their team
CREATE POLICY "Users can view timeline events in their team" ON deal_timeline_events
  FOR SELECT USING (
    deal_id IN (SELECT id FROM deals WHERE team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid()))
  );

-- Doc Packets: Users can manage packets for deals in their team
CREATE POLICY "Users can manage doc packets in their team" ON doc_packets
  FOR ALL USING (
    deal_id IN (SELECT id FROM deals WHERE team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid()))
  );

CREATE POLICY "Users can manage doc packet documents in their team" ON doc_packet_documents
  FOR ALL USING (
    doc_packet_id IN (
      SELECT id FROM doc_packets 
      WHERE deal_id IN (SELECT id FROM deals WHERE team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid()))
    )
  );

