-- Lucent Agent: Seed Data for Testing
-- This seed file creates sample data for immediate testing
-- Uses deterministic UUIDs for idempotency

-- ============================================================================
-- Team
-- ============================================================================

INSERT INTO teams (id, name) VALUES
('00000000-0000-4000-8000-000000000001', 'Lucent Realty')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Profiles (Agents)
-- Note: These reference auth.users - you'll need to create auth users first
-- For testing, you can use any UUIDs that exist in auth.users
-- ============================================================================

-- Create two sample agent profiles
-- IMPORTANT: Replace these UUIDs with actual auth.users IDs from your Supabase project
-- You can get these from: SELECT id FROM auth.users LIMIT 2;
INSERT INTO profiles (id, team_id, email, first_name, last_name, role) VALUES
('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', 'agent1@lucentrealty.com', 'Sarah', 'Chen', 'agent'),
('00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000001', 'agent2@lucentrealty.com', 'Michael', 'Rodriguez', 'agent')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Properties
-- ============================================================================

INSERT INTO properties (id, team_id, street, city, state, postal_code, unit, type, mls_id) VALUES
('00000000-0000-4000-8000-000000000010', '00000000-0000-4000-8000-000000000001', '123 Main Street', 'San Francisco', 'CA', '94102', NULL, 'condo', 'SF-12345'),
('00000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-000000000001', '456 Oak Avenue', 'Oakland', 'CA', '94601', '2B', 'condo', 'OAK-67890')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Clients
-- ============================================================================

INSERT INTO clients (id, team_id, first_name, last_name, email, phone, preferred_language) VALUES
('00000000-0000-4000-8000-000000000020', '00000000-0000-4000-8000-000000000001', 'John', 'Smith', 'john.smith@email.com', '415-555-0101', 'English'),
('00000000-0000-4000-8000-000000000021', '00000000-0000-4000-8000-000000000001', 'Emma', 'Johnson', 'emma.johnson@email.com', '415-555-0102', 'English'),
('00000000-0000-4000-8000-000000000022', '00000000-0000-4000-8000-000000000001', 'Carlos', 'Martinez', 'carlos.martinez@email.com', '510-555-0103', 'Spanish')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Agent Clients Relationships
-- ============================================================================

INSERT INTO agent_clients (id, team_id, agent_id, client_id, role_on_client, is_primary) VALUES
('00000000-0000-4000-8000-000000000030', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000020', 'primary', true),
('00000000-0000-4000-8000-000000000031', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000021', 'primary', true),
('00000000-0000-4000-8000-000000000032', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000022', 'primary', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Deals (3 deals with different statuses)
-- ============================================================================

INSERT INTO deals (id, team_id, property_address, property_id, side, status, price, loan_type, down_payment_percent, close_date, primary_agent_id, created_by, coe_date, emd_amount) VALUES
-- Deal 1: Lead status
('00000000-0000-4000-8000-000000000040', '00000000-0000-4000-8000-000000000001', '123 Main Street, San Francisco, CA', '00000000-0000-4000-8000-000000000010', 'buying', 'lead', NULL, NULL, NULL, NULL, '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', NULL, NULL),

-- Deal 2: In escrow
('00000000-0000-4000-8000-000000000041', '00000000-0000-4000-8000-000000000001', '456 Oak Avenue, Oakland, CA', '00000000-0000-4000-8000-000000000011', 'buying', 'in_escrow', 850000.00, 'conventional', 20.00, '2024-12-15', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', '2024-12-15', 17000.00),

-- Deal 3: Closed
('00000000-0000-4000-8000-000000000042', '00000000-0000-4000-8000-000000000001', '789 Pine Road, Berkeley, CA', NULL, 'buying', 'closed', 650000.00, 'fha', 3.50, '2024-11-15', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000002', '2024-11-15', 13000.00)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Deal Milestones (for active deals)
-- ============================================================================

INSERT INTO deal_milestones (id, deal_id, type, due_date, completed_at) VALUES
-- Milestones for deal 2 (in_escrow)
('00000000-0000-4000-8000-000000000050', '00000000-0000-4000-8000-000000000041', 'inspection', '2024-12-05', '2024-12-04'),
('00000000-0000-4000-8000-000000000051', '00000000-0000-4000-8000-000000000041', 'appraisal', '2024-12-10', NULL),
('00000000-0000-4000-8000-000000000052', '00000000-0000-4000-8000-000000000041', 'loan_contingency', '2024-12-12', NULL),
('00000000-0000-4000-8000-000000000053', '00000000-0000-4000-8000-000000000041', 'final_walkthrough', '2024-12-13', NULL),
('00000000-0000-4000-8000-000000000054', '00000000-0000-4000-8000-000000000041', 'closing', '2024-12-15', NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Deal Tasks (some overdue, some upcoming)
-- ============================================================================

INSERT INTO deal_tasks (id, deal_id, client_id, assigned_to, title, description, due_date, completed_at, created_by, owner_type, is_internal) VALUES
-- Overdue task
('00000000-0000-4000-8000-000000000060', '00000000-0000-4000-8000-000000000041', '00000000-0000-4000-8000-000000000021', '00000000-0000-4000-8000-000000000001', 'Review Inspection Report', 'Review and respond to inspection findings', '2024-11-20', NULL, '00000000-0000-4000-8000-000000000001', 'agent', false),

-- Upcoming tasks
('00000000-0000-4000-8000-000000000061', '00000000-0000-4000-8000-000000000041', '00000000-0000-4000-8000-000000000021', '00000000-0000-4000-8000-000000000001', 'Schedule Final Walkthrough', 'Coordinate final walkthrough with buyer', '2024-12-13', NULL, '00000000-0000-4000-8000-000000000001', 'agent', false),
('00000000-0000-4000-8000-000000000062', '00000000-0000-4000-8000-000000000041', '00000000-0000-4000-8000-000000000021', NULL, 'Submit Loan Documents', 'Provide all required documents to lender', '2024-12-08', NULL, '00000000-0000-4000-8000-000000000001', 'client', false),

-- Completed task
('00000000-0000-4000-8000-000000000063', '00000000-0000-4000-8000-000000000041', '00000000-0000-4000-8000-000000000021', '00000000-0000-4000-8000-000000000001', 'Verify EMD Receipt', 'Confirm earnest money deposit has been received', '2024-11-15', '2024-11-14', '00000000-0000-4000-8000-000000000001', 'agent', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Notes
-- ============================================================================

INSERT INTO notes (id, team_id, client_id, deal_id, author_profile_id, body, is_internal) VALUES
('00000000-0000-4000-8000-000000000070', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000020', '00000000-0000-4000-8000-000000000040', '00000000-0000-4000-8000-000000000001', 'Client is very excited about the property. Initial consultation completed.', false),
('00000000-0000-4000-8000-000000000071', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000021', '00000000-0000-4000-8000-000000000041', '00000000-0000-4000-8000-000000000001', 'Inspection completed with minor issues. Buyer requesting repairs.', true),
('00000000-0000-4000-8000-000000000072', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000022', '00000000-0000-4000-8000-000000000042', '00000000-0000-4000-8000-000000000002', 'Deal closed successfully. Client very satisfied.', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Alerts
-- ============================================================================

INSERT INTO alerts (id, deal_id, type, level, message, is_read) VALUES
('00000000-0000-4000-8000-000000000080', '00000000-0000-4000-8000-000000000041', 'closing_soon', 'warning', 'Closing date is approaching in 3 days', false),
('00000000-0000-4000-8000-000000000081', '00000000-0000-4000-8000-000000000041', 'overdue_task', 'critical', 'Task "Review Inspection Report" is overdue', false),
('00000000-0000-4000-8000-000000000082', '00000000-0000-4000-8000-000000000041', 'missing_doc', 'warning', 'Loan application documents missing', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Workflow Definition (Buyer Workflow)
-- ============================================================================

INSERT INTO workflow_definitions (id, name, description, side, trigger_type, is_active) VALUES
('00000000-0000-4000-8000-000000000090', 'Standard Buyer Workflow', 'Automated workflow for buyer transactions', 'buying', 'in_escrow', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Workflow Steps
-- ============================================================================

INSERT INTO workflow_steps (id, workflow_definition_id, step_order, name, description, relative_to, offset_days, auto_action_type, auto_config) VALUES
('00000000-0000-4000-8000-000000000091', '00000000-0000-4000-8000-000000000090', 1, 'Send Welcome Email', 'Send welcome email to buyer', 'deal_created', 0, 'send_email', '{"template_name": "buyer_welcome"}'),
('00000000-0000-4000-8000-000000000092', '00000000-0000-4000-8000-000000000090', 2, 'Create Inspection Task', 'Create task for inspection scheduling', 'deal_created', 3, 'create_task', '{"title": "Schedule Inspection", "owner_type": "agent"}'),
('00000000-0000-4000-8000-000000000093', '00000000-0000-4000-8000-000000000090', 3, 'Remind About Closing', 'Send reminder email 3 days before closing', 'coe_date', -3, 'send_email', '{"template_name": "closing_reminder"}')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Email Templates
-- ============================================================================

INSERT INTO email_templates (id, name, subject, body_html, body_text, audience) VALUES
('00000000-0000-4000-8000-000000000100', 'buyer_welcome', 'Welcome to Your Home Buying Journey', '<h1>Welcome {{buyer_name}}!</h1><p>We are excited to help you find your dream home.</p>', 'Welcome {{buyer_name}}! We are excited to help you find your dream home.', 'buyer'),
('00000000-0000-4000-8000-000000000101', 'closing_reminder', 'Closing Date Reminder', '<h1>Reminder: Your Closing is Approaching</h1><p>Your closing is scheduled for {{closing_date}}.</p>', 'Reminder: Your closing is scheduled for {{closing_date}}.', 'buyer')
ON CONFLICT (id) DO NOTHING;

