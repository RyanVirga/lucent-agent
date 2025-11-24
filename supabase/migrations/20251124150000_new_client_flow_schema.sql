-- Migration: New Client Flow Schema Extension
-- This migration adds support for the new client creation flow
-- It extends existing tables without breaking current functionality

-- ============================================================================
-- Step 1: Extend Clients Table
-- ============================================================================

-- Add new columns to support client creation flow
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS type TEXT CHECK (type IN ('buyer', 'seller', 'both')),
ADD COLUMN IF NOT EXISTS preferred_contact_method TEXT CHECK (preferred_contact_method IN ('email', 'text', 'phone')),
ADD COLUMN IF NOT EXISTS co_client_name TEXT,
ADD COLUMN IF NOT EXISTS co_client_email TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- ============================================================================
-- Step 2: Extend Deals Table
-- ============================================================================

-- Add MLS URL and target date fields
ALTER TABLE deals
ADD COLUMN IF NOT EXISTS mls_url TEXT,
ADD COLUMN IF NOT EXISTS target_date TIMESTAMPTZ;

-- ============================================================================
-- Step 3: Extend Deal Status Enum
-- ============================================================================

-- Add new status values for buyer/seller workflows
-- Note: These are idempotent - won't error if values already exist
DO $$ 
BEGIN
    -- Buyer statuses
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'deal_status' AND e.enumlabel = 'pre_approval') THEN
        ALTER TYPE deal_status ADD VALUE 'pre_approval';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'deal_status' AND e.enumlabel = 'offer') THEN
        ALTER TYPE deal_status ADD VALUE 'offer';
    END IF;
    
    -- Seller statuses
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'deal_status' AND e.enumlabel = 'pre_listing') THEN
        ALTER TYPE deal_status ADD VALUE 'pre_listing';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'deal_status' AND e.enumlabel = 'active') THEN
        ALTER TYPE deal_status ADD VALUE 'active';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'deal_status' AND e.enumlabel = 'offer_review') THEN
        ALTER TYPE deal_status ADD VALUE 'offer_review';
    END IF;
END $$;

-- ============================================================================
-- Step 4: Create Portal Invites Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS portal_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'accepted')) DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add index for client lookups
CREATE INDEX IF NOT EXISTS idx_portal_invites_client_id ON portal_invites(client_id);
CREATE INDEX IF NOT EXISTS idx_portal_invites_status ON portal_invites(status) WHERE status != 'accepted';

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_portal_invites_updated_at ON portal_invites;
CREATE TRIGGER update_portal_invites_updated_at 
  BEFORE UPDATE ON portal_invites 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for Portal Invites
ALTER TABLE portal_invites ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view portal invites in their team" ON portal_invites;
CREATE POLICY "Users can view portal invites in their team" ON portal_invites
  FOR SELECT USING (
    client_id IN (
      SELECT id FROM clients WHERE team_id IN (
        SELECT team_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can create portal invites in their team" ON portal_invites;
CREATE POLICY "Users can create portal invites in their team" ON portal_invites
  FOR INSERT WITH CHECK (
    client_id IN (
      SELECT id FROM clients WHERE team_id IN (
        SELECT team_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can update portal invites in their team" ON portal_invites;
CREATE POLICY "Users can update portal invites in their team" ON portal_invites
  FOR UPDATE USING (
    client_id IN (
      SELECT id FROM clients WHERE team_id IN (
        SELECT team_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- ============================================================================
-- Step 5: Seed Default Workflow Definitions
-- ============================================================================

-- Insert buyer workflow definition (if not exists)
INSERT INTO workflow_definitions (name, side, trigger_type, description, is_active)
VALUES 
  ('Buyer Standard Workflow', 'buying', 'manual', 'Standard workflow for new buyer clients', true)
ON CONFLICT DO NOTHING;

-- Insert seller workflow definition (if not exists)
INSERT INTO workflow_definitions (name, side, trigger_type, description, is_active)
VALUES 
  ('Seller Standard Workflow', 'listing', 'manual', 'Standard workflow for new seller clients', true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Step 6: Add Helper Function for Client Creation
-- ============================================================================

-- This function helps ensure atomicity when creating clients with deals
CREATE OR REPLACE FUNCTION create_client_with_deals(
  p_team_id UUID,
  p_agent_id UUID,
  p_client_data JSONB,
  p_deals_data JSONB[]
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_id UUID;
  v_deal JSONB;
  v_deal_id UUID;
  v_workflow_id UUID;
BEGIN
  -- Create client
  INSERT INTO clients (
    team_id,
    first_name,
    last_name,
    email,
    phone,
    preferred_language,
    type,
    preferred_contact_method,
    co_client_name,
    co_client_email,
    notes
  )
  VALUES (
    p_team_id,
    p_client_data->>'first_name',
    p_client_data->>'last_name',
    p_client_data->>'email',
    p_client_data->>'phone',
    COALESCE(p_client_data->>'preferred_language', 'en'),
    p_client_data->>'type',
    p_client_data->>'preferred_contact_method',
    p_client_data->>'co_client_name',
    p_client_data->>'co_client_email',
    p_client_data->>'notes'
  )
  RETURNING id INTO v_client_id;

  -- Link agent to client
  INSERT INTO agent_clients (team_id, agent_id, client_id, is_primary, role_on_client)
  VALUES (p_team_id, p_agent_id, v_client_id, true, 'primary');

  -- Create portal invite
  INSERT INTO portal_invites (client_id, email, status)
  VALUES (v_client_id, p_client_data->>'email', 'sent');

  -- Create deals if provided
  IF p_deals_data IS NOT NULL THEN
    FOREACH v_deal IN ARRAY p_deals_data
    LOOP
      -- Create deal
      INSERT INTO deals (
        team_id,
        primary_agent_id,
        property_address,
        mls_url,
        price,
        target_date,
        close_date,
        side,
        status
      )
      VALUES (
        p_team_id,
        p_agent_id,
        v_deal->>'property_address',
        v_deal->>'mls_url',
        (v_deal->>'price')::DECIMAL,
        (v_deal->>'target_date')::TIMESTAMPTZ,
        (v_deal->>'close_date')::TIMESTAMPTZ,
        (v_deal->>'side')::deal_side,
        (v_deal->>'status')::deal_status
      )
      RETURNING id INTO v_deal_id;

      -- Create deal party
      INSERT INTO deal_parties (deal_id, client_id, role, name, email, phone)
      VALUES (
        v_deal_id,
        v_client_id,
        (v_deal->>'party_role')::party_role,
        p_client_data->>'first_name' || ' ' || p_client_data->>'last_name',
        p_client_data->>'email',
        p_client_data->>'phone'
      );

      -- Find and attach workflow
      SELECT id INTO v_workflow_id
      FROM workflow_definitions
      WHERE side = (v_deal->>'side')::deal_side
        AND is_active = true
      LIMIT 1;

      IF v_workflow_id IS NOT NULL THEN
        INSERT INTO workflow_runs (deal_id, workflow_definition_id, status)
        VALUES (v_deal_id, v_workflow_id, 'active');
      END IF;
    END LOOP;
  END IF;

  RETURN v_client_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_client_with_deals TO authenticated;

