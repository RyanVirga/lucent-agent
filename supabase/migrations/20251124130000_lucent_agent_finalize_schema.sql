-- Lucent Agent: Finalize Schema Migration
-- This migration finalizes the schema by enabling RLS, creating policies, indexes, and triggers
-- Works with existing tables

-- ============================================================================
-- Step 1: Ensure All Required Columns Exist
-- ============================================================================

-- Deal Parties: Ensure name column exists (it should, but check)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deal_parties' AND column_name = 'name') THEN
    ALTER TABLE deal_parties ADD COLUMN name TEXT;
  END IF;
END $$;

-- ============================================================================
-- Step 2: Create Updated At Trigger Function (Secure)
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
-- Step 3: Apply Updated At Triggers
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
-- Step 4: Create Performance Indexes (if not exist)
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
-- Step 5: Enable Row Level Security
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
-- Step 6: Create RLS Policies
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

