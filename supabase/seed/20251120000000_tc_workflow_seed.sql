-- Lucent Agent TC Workflow Seed Data
-- This seed file creates default buying and listing side workflows with email templates
-- Uses deterministic UUIDs for idempotency (INSERT ... ON CONFLICT DO NOTHING)

-- ============================================================================
-- Email Templates
-- ============================================================================

-- Buyer Welcome Email Template
INSERT INTO email_templates (id, name, subject, body_html, body_text, audience) VALUES
('a1b2c3d4-e5f6-4789-a012-345678901234', 'buyer_welcome', 
 'Welcome to Your New Home Journey - {{property_address}}',
 '<html><body><h2>Welcome, {{buyer_name}}!</h2><p>Congratulations on entering escrow for {{property_address}}.</p><p>Your close of escrow date is {{coe_date}}.</p><p>We''ll keep you updated throughout the process.</p></body></html>',
 'Welcome, {{buyer_name}}! Congratulations on entering escrow for {{property_address}}. Your close of escrow date is {{coe_date}}. We''ll keep you updated throughout the process.',
 'buyer')
ON CONFLICT (name) DO NOTHING;

-- Seller Welcome Email Template
INSERT INTO email_templates (id, name, subject, body_html, body_text, audience) VALUES
('b2c3d4e5-f6a7-4890-b123-456789012345', 'seller_welcome',
 'Your Property is in Escrow - {{property_address}}',
 '<html><body><h2>Congratulations, {{seller_name}}!</h2><p>Your property at {{property_address}} is now in escrow.</p><p>The close of escrow date is {{coe_date}}.</p><p>We''ll guide you through each step.</p></body></html>',
 'Congratulations, {{seller_name}}! Your property at {{property_address}} is now in escrow. The close of escrow date is {{coe_date}}. We''ll guide you through each step.',
 'seller')
ON CONFLICT (name) DO NOTHING;

-- Escrow Info to Lender Template
INSERT INTO email_templates (id, name, subject, body_html, body_text, audience) VALUES
('c3d4e5f6-a7b8-4901-c234-567890123456', 'escrow_info_lender',
 'New Escrow - {{property_address}}',
 '<html><body><h2>New Escrow Notification</h2><p>Property: {{property_address}}</p><p>Buyer: {{buyer_name}}</p><p>Close of Escrow: {{coe_date}}</p><p>Escrow Company: {{escrow_company}}</p></body></html>',
 'New Escrow Notification - Property: {{property_address}}, Buyer: {{buyer_name}}, Close of Escrow: {{coe_date}}, Escrow Company: {{escrow_company}}',
 'lender')
ON CONFLICT (name) DO NOTHING;

-- Escrow Info to Escrow Company Template
INSERT INTO email_templates (id, name, subject, body_html, body_text, audience) VALUES
('d4e5f6a7-b8c9-4012-d345-678901234567', 'escrow_info_escrow',
 'New Escrow Opened - {{property_address}}',
 '<html><body><h2>Escrow Details</h2><p>Property: {{property_address}}</p><p>Buyer: {{buyer_name}}</p><p>Seller: {{seller_name}}</p><p>Close Date: {{coe_date}}</p><p>EMD Amount: ${{emd_amount}}</p></body></html>',
 'Escrow Details - Property: {{property_address}}, Buyer: {{buyer_name}}, Seller: {{seller_name}}, Close Date: {{coe_date}}, EMD Amount: ${{emd_amount}}',
 'escrow')
ON CONFLICT (name) DO NOTHING;

-- Inspection Deadline Reminder Template
INSERT INTO email_templates (id, name, subject, body_html, body_text, audience) VALUES
('e5f6a7b8-c9d0-4123-e456-789012345678', 'inspection_deadline_reminder',
 'Inspection Deadline Approaching - {{property_address}}',
 '<html><body><h2>Inspection Deadline Reminder</h2><p>The inspection deadline for {{property_address}} is {{inspection_deadline}}.</p><p>Please ensure all inspections are completed and contingencies are addressed.</p></body></html>',
 'Inspection Deadline Reminder - The inspection deadline for {{property_address}} is {{inspection_deadline}}. Please ensure all inspections are completed and contingencies are addressed.',
 'buyer')
ON CONFLICT (name) DO NOTHING;

-- COE Congratulations Template
INSERT INTO email_templates (id, name, subject, body_html, body_text, audience) VALUES
('f6a7b8c9-d0e1-4234-f567-890123456789', 'coe_congratulations',
 'Congratulations! Your Transaction Closed - {{property_address}}',
 '<html><body><h2>Congratulations!</h2><p>Your transaction for {{property_address}} has closed successfully.</p><p>Close Date: {{coe_date}}</p><p>Thank you for choosing us to help with your real estate transaction.</p></body></html>',
 'Congratulations! Your transaction for {{property_address}} has closed successfully. Close Date: {{coe_date}}. Thank you for choosing us.',
 'buyer')
ON CONFLICT (name) DO NOTHING;

-- Post-Close Follow-up Template
INSERT INTO email_templates (id, name, subject, body_html, body_text, audience) VALUES
('a7b8c9d0-e1f2-4345-a678-901234567890', 'post_close_followup',
 'How Was Your Experience? - {{property_address}}',
 '<html><body><h2>Thank You!</h2><p>We hope your experience with {{property_address}} was excellent.</p><p>Please let us know if you need anything else or have feedback.</p></body></html>',
 'Thank You! We hope your experience with {{property_address}} was excellent. Please let us know if you need anything else.',
 'buyer')
ON CONFLICT (name) DO NOTHING;

-- Seller Disclosure Reminder Template
INSERT INTO email_templates (id, name, subject, body_html, body_text, audience) VALUES
('b8c9d0e1-f2a3-4456-b789-012345678901', 'disclosure_reminder',
 'Disclosure Documents Needed - {{property_address}}',
 '<html><body><h2>Disclosure Reminder</h2><p>Please provide all required disclosure documents for {{property_address}}.</p><p>These are needed to keep the transaction on track for the {{coe_date}} close date.</p></body></html>',
 'Disclosure Reminder - Please provide all required disclosure documents for {{property_address}}. Needed for {{coe_date}} close date.',
 'seller')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- Buying Side Workflow Definition
-- ============================================================================

INSERT INTO workflow_definitions (id, name, description, side, trigger_type, is_active) VALUES
('11111111-1111-4111-8111-111111111111', 'Buying Side TC Workflow',
 'Standard transaction coordination workflow for buying side deals',
 'buying', 'in_escrow', true)
ON CONFLICT DO NOTHING;

-- Buying Side Workflow Steps
-- Step 1: Welcome email to buyer
INSERT INTO workflow_steps (id, workflow_definition_id, step_order, name, description, relative_to, offset_days, auto_action_type, auto_config) VALUES
('21111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', 1,
 'Send Buyer Welcome Email', 'Welcome email to buyer when deal enters escrow',
 'deal_created', 0, 'send_email',
 '{"template_name": "buyer_welcome", "audience": "buyer"}'::jsonb)
ON CONFLICT DO NOTHING;

-- Step 2: Send escrow info to lender
INSERT INTO workflow_steps (id, workflow_definition_id, step_order, name, description, relative_to, offset_days, auto_action_type, auto_config) VALUES
('21111111-1111-4111-8111-111111111112', '11111111-1111-4111-8111-111111111111', 2,
 'Notify Lender', 'Send escrow details to lender',
 'deal_created', 0, 'send_email',
 '{"template_name": "escrow_info_lender", "audience": "lender"}'::jsonb)
ON CONFLICT DO NOTHING;

-- Step 3: Send escrow info to escrow company
INSERT INTO workflow_steps (id, workflow_definition_id, step_order, name, description, relative_to, offset_days, auto_action_type, auto_config) VALUES
('21111111-1111-4111-8111-111111111113', '11111111-1111-4111-8111-111111111111', 3,
 'Notify Escrow Company', 'Send escrow details to escrow company',
 'deal_created', 0, 'send_email',
 '{"template_name": "escrow_info_escrow", "audience": "escrow"}'::jsonb)
ON CONFLICT DO NOTHING;

-- Step 4: Create EMD verification task
INSERT INTO workflow_steps (id, workflow_definition_id, step_order, name, description, relative_to, offset_days, auto_action_type, auto_config) VALUES
('21111111-1111-4111-8111-111111111114', '11111111-1111-4111-8111-111111111111', 4,
 'EMD Verification Task', 'Create task to verify EMD receipt',
 'deal_created', 1, 'create_task',
 '{"title": "Verify EMD Receipt", "description": "Confirm that earnest money deposit has been received by escrow", "due_date_offset_days": 3}'::jsonb)
ON CONFLICT DO NOTHING;

-- Step 5: Wait for EMD received event
INSERT INTO workflow_steps (id, workflow_definition_id, step_order, name, description, relative_to, offset_days, auto_action_type, auto_config) VALUES
('21111111-1111-4111-8111-111111111115', '11111111-1111-4111-8111-111111111111', 5,
 'Wait for EMD', 'Wait for EMD received confirmation',
 'deal_created', 0, 'wait_for_event',
 '{"event_type": "emd_received"}'::jsonb)
ON CONFLICT DO NOTHING;

-- Step 6: Inspection deadline reminder (3 days before)
INSERT INTO workflow_steps (id, workflow_definition_id, step_order, name, description, relative_to, offset_days, auto_action_type, auto_config) VALUES
('21111111-1111-4111-8111-111111111116', '11111111-1111-4111-8111-111111111111', 6,
 'Inspection Deadline Reminder', 'Remind buyer about approaching inspection deadline',
 'inspection_deadline', -3, 'send_email',
 '{"template_name": "inspection_deadline_reminder", "audience": "buyer"}'::jsonb)
ON CONFLICT DO NOTHING;

-- Step 7: Wait for inspection contingency removal
INSERT INTO workflow_steps (id, workflow_definition_id, step_order, name, description, relative_to, offset_days, auto_action_type, auto_config) VALUES
('21111111-1111-4111-8111-111111111117', '11111111-1111-4111-8111-111111111111', 7,
 'Wait for Inspection Contingency', 'Wait for inspection contingency to be removed',
 'deal_created', 0, 'wait_for_event',
 '{"event_type": "inspection_contingency_removed"}'::jsonb)
ON CONFLICT DO NOTHING;

-- Step 8: COE congratulations email
INSERT INTO workflow_steps (id, workflow_definition_id, step_order, name, description, relative_to, offset_days, auto_action_type, auto_config) VALUES
('21111111-1111-4111-8111-111111111118', '11111111-1111-4111-8111-111111111111', 8,
 'COE Congratulations', 'Send congratulations email on close of escrow',
 'coe_date', 0, 'send_email',
 '{"template_name": "coe_congratulations", "audience": "buyer"}'::jsonb)
ON CONFLICT DO NOTHING;

-- Step 9: Post-close follow-up task
INSERT INTO workflow_steps (id, workflow_definition_id, step_order, name, description, relative_to, offset_days, auto_action_type, auto_config) VALUES
('21111111-1111-4111-8111-111111111119', '11111111-1111-4111-8111-111111111111', 9,
 'Post-Close Follow-up', 'Create task for post-close follow-up',
 'coe_date', 7, 'create_task',
 '{"title": "Post-Close Follow-up", "description": "Follow up with client after close", "due_date_offset_days": 7}'::jsonb)
ON CONFLICT DO NOTHING;

-- Step 10: Post-close follow-up email
INSERT INTO workflow_steps (id, workflow_definition_id, step_order, name, description, relative_to, offset_days, auto_action_type, auto_config) VALUES
('21111111-1111-4111-8111-111111111120', '11111111-1111-4111-8111-111111111111', 10,
 'Send Follow-up Email', 'Send post-close follow-up email',
 'coe_date', 14, 'send_email',
 '{"template_name": "post_close_followup", "audience": "buyer"}'::jsonb)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Listing Side Workflow Definition
-- ============================================================================

INSERT INTO workflow_definitions (id, name, description, side, trigger_type, is_active) VALUES
('22222222-2222-4222-8222-222222222222', 'Listing Side TC Workflow',
 'Standard transaction coordination workflow for listing side deals',
 'listing', 'in_escrow', true)
ON CONFLICT DO NOTHING;

-- Listing Side Workflow Steps
-- Step 1: Seller welcome email
INSERT INTO workflow_steps (id, workflow_definition_id, step_order, name, description, relative_to, offset_days, auto_action_type, auto_config) VALUES
('32222222-2222-4222-8222-222222222221', '22222222-2222-4222-8222-222222222222', 1,
 'Send Seller Welcome Email', 'Welcome email to seller when deal enters escrow',
 'deal_created', 0, 'send_email',
 '{"template_name": "seller_welcome", "audience": "seller"}'::jsonb)
ON CONFLICT DO NOTHING;

-- Step 2: Send escrow info to buyer agent
INSERT INTO workflow_steps (id, workflow_definition_id, step_order, name, description, relative_to, offset_days, auto_action_type, auto_config) VALUES
('32222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222', 2,
 'Notify Buyer Agent', 'Send escrow details to buyer agent',
 'deal_created', 0, 'send_email',
 '{"template_name": "escrow_info_lender", "audience": "buyer_agent"}'::jsonb)
ON CONFLICT DO NOTHING;

-- Step 3: Create disclosure task
INSERT INTO workflow_steps (id, workflow_definition_id, step_order, name, description, relative_to, offset_days, auto_action_type, auto_config) VALUES
('32222222-2222-4222-8222-222222222223', '22222222-2222-4222-8222-222222222222', 3,
 'Disclosure Task', 'Create task to complete seller disclosures',
 'deal_created', 2, 'create_task',
 '{"title": "Complete Seller Disclosures", "description": "Ensure all required disclosure documents are prepared and delivered", "due_date_offset_days": 5}'::jsonb)
ON CONFLICT DO NOTHING;

-- Step 4: Send disclosure reminder
INSERT INTO workflow_steps (id, workflow_definition_id, step_order, name, description, relative_to, offset_days, auto_action_type, auto_config) VALUES
('32222222-2222-4222-8222-222222222224', '22222222-2222-4222-8222-222222222222', 4,
 'Disclosure Reminder', 'Remind seller about disclosure requirements',
 'deal_created', 3, 'send_email',
 '{"template_name": "disclosure_reminder", "audience": "seller"}'::jsonb)
ON CONFLICT DO NOTHING;

-- Step 5: Inspection deadline reminder (to seller)
INSERT INTO workflow_steps (id, workflow_definition_id, step_order, name, description, relative_to, offset_days, auto_action_type, auto_config) VALUES
('32222222-2222-4222-8222-222222222225', '22222222-2222-4222-8222-222222222222', 5,
 'Inspection Reminder', 'Remind seller about inspection deadline',
 'inspection_deadline', -2, 'send_email',
 '{"template_name": "inspection_deadline_reminder", "audience": "seller"}'::jsonb)
ON CONFLICT DO NOTHING;

-- Step 6: Wait for inspection contingency removal
INSERT INTO workflow_steps (id, workflow_definition_id, step_order, name, description, relative_to, offset_days, auto_action_type, auto_config) VALUES
('32222222-2222-4222-8222-222222222226', '22222222-2222-4222-8222-222222222222', 6,
 'Wait for Inspection Contingency', 'Wait for inspection contingency to be removed',
 'deal_created', 0, 'wait_for_event',
 '{"event_type": "inspection_contingency_removed"}'::jsonb)
ON CONFLICT DO NOTHING;

-- Step 7: COE congratulations email
INSERT INTO workflow_steps (id, workflow_definition_id, step_order, name, description, relative_to, offset_days, auto_action_type, auto_config) VALUES
('32222222-2222-4222-8222-222222222227', '22222222-2222-4222-8222-222222222222', 7,
 'COE Congratulations', 'Send congratulations email on close of escrow',
 'coe_date', 0, 'send_email',
 '{"template_name": "coe_congratulations", "audience": "seller"}'::jsonb)
ON CONFLICT DO NOTHING;

-- Step 8: Archive task
INSERT INTO workflow_steps (id, workflow_definition_id, step_order, name, description, relative_to, offset_days, auto_action_type, auto_config) VALUES
('32222222-2222-4222-8222-222222222228', '22222222-2222-4222-8222-222222222222', 8,
 'Archive Deal', 'Create task to archive deal documents',
 'coe_date', 7, 'create_task',
 '{"title": "Archive Deal Documents", "description": "Archive all deal documents and close out file", "due_date_offset_days": 7}'::jsonb)
ON CONFLICT DO NOTHING;

