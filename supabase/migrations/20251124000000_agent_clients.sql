-- Lucent Agent: Agent Clients Portal Migration
-- This migration extends the schema to support client management, properties, milestones, notes, and alerts

-- ============================================================================
-- Enum Extensions and New Enums
-- ============================================================================

-- Extend deal_status enum
ALTER TYPE deal_status ADD VALUE IF NOT EXISTS 'lead';
ALTER TYPE deal_status ADD VALUE IF NOT EXISTS 'searching';
ALTER TYPE deal_status ADD VALUE IF NOT EXISTS 'under_contract';
ALTER TYPE deal_status ADD VALUE IF NOT EXISTS 'pending';

-- Extend deal_side enum
ALTER TYPE deal_side ADD VALUE IF NOT EXISTS 'landlord';
ALTER TYPE deal_side ADD VALUE IF NOT EXISTS 'tenant';
ALTER TYPE deal_side ADD VALUE IF NOT EXISTS 'dual';

-- New enums for agent clients portal
CREATE TYPE property_type AS ENUM ('sfr', 'condo', 'townhouse', 'multi_unit', 'mixed_use');
CREATE TYPE milestone_type AS ENUM ('inspection', 'appraisal', 'loan_contingency', 'hoa_review', 'final_walkthrough', 'closing');
CREATE TYPE owner_type AS ENUM ('agent', 'client', 'lender', 'escrow');
CREATE TYPE alert_type AS ENUM ('overdue_task', 'missing_doc', 'closing_soon');
CREATE TYPE alert_level AS ENUM ('info', 'warning', 'critical');
CREATE TYPE role_on_client AS ENUM ('primary', 'co_agent');

-- ============================================================================
-- New Tables
-- ============================================================================

-- Clients: Long-term CRM contacts
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  preferred_language TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Properties: Normalized property data
CREATE TABLE properties (
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

-- Agent Clients: Junction table linking agents to clients
CREATE TABLE agent_clients (
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
CREATE TABLE notes (
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
-- Alter Existing Tables
-- ============================================================================

-- Deals: Add property_id and additional fields
ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES properties(id),
  ADD COLUMN IF NOT EXISTS close_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS loan_type TEXT,
  ADD COLUMN IF NOT EXISTS down_payment_percent DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS primary_agent_id UUID REFERENCES profiles(id);

-- Deal Parties: Add client_id to link to clients table
ALTER TABLE deal_parties
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;

-- Deal Tasks: Add client_id, owner_type, and is_internal
ALTER TABLE deal_tasks
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS owner_type TEXT DEFAULT 'agent' CHECK (owner_type IN ('agent', 'client', 'lender', 'escrow')),
  ADD COLUMN IF NOT EXISTS is_internal BOOLEAN NOT NULL DEFAULT false;

-- Doc Packet Documents: Add deal_id, client_id, and doc_type
ALTER TABLE doc_packet_documents
  ADD COLUMN IF NOT EXISTS deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS doc_type TEXT;

-- ============================================================================
-- Indexes
-- ============================================================================

-- Clients indexes
CREATE INDEX idx_clients_team_id ON clients(team_id);
CREATE INDEX idx_clients_email ON clients(email) WHERE email IS NOT NULL;
CREATE INDEX idx_clients_created_at ON clients(created_at DESC);

-- Properties indexes
CREATE INDEX idx_properties_team_id ON properties(team_id);
CREATE INDEX idx_properties_mls_id ON properties(mls_id) WHERE mls_id IS NOT NULL;
CREATE INDEX idx_properties_city_state ON properties(city, state);

-- Agent Clients indexes
CREATE INDEX idx_agent_clients_team_id ON agent_clients(team_id);
CREATE INDEX idx_agent_clients_agent_id ON agent_clients(agent_id);
CREATE INDEX idx_agent_clients_client_id ON agent_clients(client_id);
CREATE INDEX idx_agent_clients_primary ON agent_clients(agent_id, is_primary) WHERE is_primary = true;

-- Deal Milestones indexes
CREATE INDEX idx_deal_milestones_deal_id ON deal_milestones(deal_id);
CREATE INDEX idx_deal_milestones_due_date ON deal_milestones(due_date) WHERE completed_at IS NULL;
CREATE INDEX idx_deal_milestones_type ON deal_milestones(type);

-- Notes indexes
CREATE INDEX idx_notes_team_id ON notes(team_id);
CREATE INDEX idx_notes_client_id ON notes(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX idx_notes_deal_id ON notes(deal_id) WHERE deal_id IS NOT NULL;
CREATE INDEX idx_notes_created_at ON notes(created_at DESC);

-- Alerts indexes
CREATE INDEX idx_alerts_deal_id ON alerts(deal_id);
CREATE INDEX idx_alerts_is_read ON alerts(is_read) WHERE is_read = false;
CREATE INDEX idx_alerts_level ON alerts(level);

-- Deal Tasks indexes (additional)
CREATE INDEX idx_deal_tasks_client_id ON deal_tasks(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX idx_deal_tasks_owner_type ON deal_tasks(owner_type);

-- Deals indexes (additional)
CREATE INDEX idx_deals_property_id ON deals(property_id) WHERE property_id IS NOT NULL;
CREATE INDEX idx_deals_primary_agent_id ON deals(primary_agent_id) WHERE primary_agent_id IS NOT NULL;
CREATE INDEX idx_deals_close_date ON deals(close_date) WHERE close_date IS NOT NULL;

-- Doc Packet Documents indexes (additional)
CREATE INDEX idx_doc_packet_documents_deal_id ON doc_packet_documents(deal_id) WHERE deal_id IS NOT NULL;
CREATE INDEX idx_doc_packet_documents_client_id ON doc_packet_documents(client_id) WHERE client_id IS NOT NULL;

-- ============================================================================
-- Triggers
-- ============================================================================

-- Apply updated_at triggers to new tables that need it
-- (clients, properties, agent_clients don't have updated_at, notes and alerts don't need it)

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Clients: Users can view clients in their team
CREATE POLICY "Users can view clients in their team" ON clients
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can create clients in their team" ON clients
  FOR INSERT WITH CHECK (
    team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can update clients in their team" ON clients
  FOR UPDATE USING (
    team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid())
  );

-- Properties: Users can manage properties in their team
CREATE POLICY "Users can manage properties in their team" ON properties
  FOR ALL USING (
    team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid())
  );

-- Agent Clients: Users can view agent_client relationships in their team
CREATE POLICY "Users can view agent_clients in their team" ON agent_clients
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can manage agent_clients in their team" ON agent_clients
  FOR ALL USING (
    team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid())
    AND agent_id = auth.uid() -- Agents can only manage their own relationships
  );

-- Deal Milestones: Users can manage milestones for deals in their team
CREATE POLICY "Users can manage deal milestones in their team" ON deal_milestones
  FOR ALL USING (
    deal_id IN (SELECT id FROM deals WHERE team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid()))
  );

-- Notes: Users can manage notes in their team
CREATE POLICY "Users can manage notes in their team" ON notes
  FOR ALL USING (
    team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid())
  );

-- Alerts: Users can view and update alerts for deals in their team
CREATE POLICY "Users can view alerts in their team" ON alerts
  FOR SELECT USING (
    deal_id IN (SELECT id FROM deals WHERE team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid()))
  );

CREATE POLICY "Users can update alerts in their team" ON alerts
  FOR UPDATE USING (
    deal_id IN (SELECT id FROM deals WHERE team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid()))
  );

