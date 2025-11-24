-- Transaction Email Automation Migration
-- Extends deals table, email_templates, and adds supporting tables for transaction coordination

-- ============================================================================
-- Step 1: Create Supporting Tables for Contacts
-- ============================================================================

-- Escrow Companies
CREATE TABLE IF NOT EXISTS escrow_companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  contact_person TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lenders
CREATE TABLE IF NOT EXISTS lenders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  loan_officer_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Step 2: Extend Deals Table with Transaction Fields
-- ============================================================================

-- Add transaction-specific fields to deals table
ALTER TABLE deals 
  ADD COLUMN IF NOT EXISTS escrow_company_id UUID REFERENCES escrow_companies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS lender_id UUID REFERENCES lenders(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS has_hoa BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_solar BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS tc_fee_amount NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS tc_fee_payer TEXT CHECK (tc_fee_payer IN ('seller', 'buyer', 'other')),
  ADD COLUMN IF NOT EXISTS offer_acceptance_date DATE,
  ADD COLUMN IF NOT EXISTS emd_due_date DATE,
  ADD COLUMN IF NOT EXISTS seller_disclosures_due_date DATE,
  ADD COLUMN IF NOT EXISTS buyer_investigation_due_date DATE,
  ADD COLUMN IF NOT EXISTS buyer_appraisal_due_date DATE,
  ADD COLUMN IF NOT EXISTS buyer_loan_due_date DATE,
  ADD COLUMN IF NOT EXISTS buyer_insurance_due_date DATE,
  ADD COLUMN IF NOT EXISTS estimated_coe_date DATE,
  ADD COLUMN IF NOT EXISTS possession_date DATE,
  ADD COLUMN IF NOT EXISTS inspection_scheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS appraisal_ordered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS hoa_docs_received_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS seller_disclosures_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS buyer_disclosures_signed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cda_prepared_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cda_sent_to_escrow_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;

-- ============================================================================
-- Step 3: Extend Email Templates Table
-- ============================================================================

-- Add new columns to email_templates
ALTER TABLE email_templates 
  ADD COLUMN IF NOT EXISTS key TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS side TEXT CHECK (side IN ('listing', 'buying')),
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Rename audience to audience_type for clarity
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'email_templates' AND column_name = 'audience'
  ) THEN
    ALTER TABLE email_templates RENAME COLUMN audience TO audience_type;
  END IF;
END $$;

-- Update audience_type check constraint
ALTER TABLE email_templates DROP CONSTRAINT IF EXISTS email_templates_audience_check;
ALTER TABLE email_templates DROP CONSTRAINT IF EXISTS email_templates_audience_type_check;
ALTER TABLE email_templates ADD CONSTRAINT email_templates_audience_type_check 
  CHECK (audience_type IN ('escrow', 'lender', 'listing_agent', 'buying_agent', 'all_parties', 'seller', 'buyer', 'internal_chat'));

-- Rename subject to subject_template for clarity
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'email_templates' AND column_name = 'subject'
  ) THEN
    ALTER TABLE email_templates RENAME COLUMN subject TO subject_template;
  END IF;
END $$;

-- Backfill key column for existing templates (use name as key)
UPDATE email_templates SET key = name WHERE key IS NULL;

-- ============================================================================
-- Step 4: Create Transaction Email Log Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS transaction_email_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  template_key TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  context_date DATE,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending')),
  error_message TEXT,
  recipient_emails TEXT[], -- Array of emails sent to
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_deal_template_context UNIQUE (deal_id, template_key, context_date)
);

-- ============================================================================
-- Step 5: Create Indexes for Performance
-- ============================================================================

-- Escrow Companies indexes
CREATE INDEX IF NOT EXISTS idx_escrow_companies_team_id ON escrow_companies(team_id);
CREATE INDEX IF NOT EXISTS idx_escrow_companies_email ON escrow_companies(email) WHERE email IS NOT NULL;

-- Lenders indexes
CREATE INDEX IF NOT EXISTS idx_lenders_team_id ON lenders(team_id);
CREATE INDEX IF NOT EXISTS idx_lenders_email ON lenders(email) WHERE email IS NOT NULL;

-- Deals indexes for transaction fields
CREATE INDEX IF NOT EXISTS idx_deals_escrow_company_id ON deals(escrow_company_id) WHERE escrow_company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_deals_lender_id ON deals(lender_id) WHERE lender_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_deals_offer_acceptance_date ON deals(offer_acceptance_date) WHERE offer_acceptance_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_deals_estimated_coe_date ON deals(estimated_coe_date) WHERE estimated_coe_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_deals_has_hoa ON deals(has_hoa) WHERE has_hoa = true;
CREATE INDEX IF NOT EXISTS idx_deals_has_solar ON deals(has_solar) WHERE has_solar = true;

-- Email templates indexes
CREATE INDEX IF NOT EXISTS idx_email_templates_key ON email_templates(key) WHERE key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_templates_side ON email_templates(side) WHERE side IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON email_templates(is_active) WHERE is_active = true;

-- Transaction email log indexes
CREATE INDEX IF NOT EXISTS idx_transaction_email_log_deal_id ON transaction_email_log(deal_id);
CREATE INDEX IF NOT EXISTS idx_transaction_email_log_template_key ON transaction_email_log(template_key);
CREATE INDEX IF NOT EXISTS idx_transaction_email_log_sent_at ON transaction_email_log(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_transaction_email_log_status ON transaction_email_log(status);
CREATE INDEX IF NOT EXISTS idx_transaction_email_log_context_date ON transaction_email_log(context_date) WHERE context_date IS NOT NULL;

-- ============================================================================
-- Step 6: Add Triggers for Updated At
-- ============================================================================

DROP TRIGGER IF EXISTS update_escrow_companies_updated_at ON escrow_companies;
CREATE TRIGGER update_escrow_companies_updated_at 
  BEFORE UPDATE ON escrow_companies 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lenders_updated_at ON lenders;
CREATE TRIGGER update_lenders_updated_at 
  BEFORE UPDATE ON lenders 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Step 7: Enable RLS on New Tables
-- ============================================================================

ALTER TABLE escrow_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE lenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_email_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Step 8: Create RLS Policies
-- ============================================================================

-- Escrow Companies
DROP POLICY IF EXISTS "Users can view escrow companies in their team" ON escrow_companies;
CREATE POLICY "Users can view escrow companies in their team" ON escrow_companies
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can manage escrow companies in their team" ON escrow_companies;
CREATE POLICY "Users can manage escrow companies in their team" ON escrow_companies
  FOR ALL USING (
    team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid())
  );

-- Lenders
DROP POLICY IF EXISTS "Users can view lenders in their team" ON lenders;
CREATE POLICY "Users can view lenders in their team" ON lenders
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can manage lenders in their team" ON lenders;
CREATE POLICY "Users can manage lenders in their team" ON lenders
  FOR ALL USING (
    team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid())
  );

-- Transaction Email Log
DROP POLICY IF EXISTS "Users can view email logs for their team's deals" ON transaction_email_log;
CREATE POLICY "Users can view email logs for their team's deals" ON transaction_email_log
  FOR SELECT USING (
    deal_id IN (SELECT id FROM deals WHERE team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid()))
  );

-- Service role can insert email logs (for cron jobs and automation)
DROP POLICY IF EXISTS "Service role can insert email logs" ON transaction_email_log;
CREATE POLICY "Service role can insert email logs" ON transaction_email_log
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- Step 9: Add Comments for Documentation
-- ============================================================================

COMMENT ON TABLE escrow_companies IS 'Escrow companies used in real estate transactions';
COMMENT ON TABLE lenders IS 'Lenders providing financing for transactions';
COMMENT ON TABLE transaction_email_log IS 'Log of all automated transaction emails sent, prevents duplicates';

COMMENT ON COLUMN deals.has_hoa IS 'Whether the property has an HOA';
COMMENT ON COLUMN deals.has_solar IS 'Whether the property has solar panels requiring transfer';
COMMENT ON COLUMN deals.tc_fee_amount IS 'Transaction coordinator fee amount';
COMMENT ON COLUMN deals.estimated_coe_date IS 'Estimated close of escrow date';

COMMENT ON COLUMN email_templates.key IS 'Unique programmatic key for template lookup (e.g., listing_opening_escrow_chat)';
COMMENT ON COLUMN email_templates.side IS 'Transaction side this template applies to (listing, buying, or null for shared)';
COMMENT ON COLUMN email_templates.audience_type IS 'Who receives this email (escrow, lender, agents, parties, seller, buyer, internal_chat)';

COMMENT ON COLUMN transaction_email_log.context_date IS 'Date context for email (e.g., due date for reminders), used with unique constraint to prevent duplicate sends';

