-- Transaction Email Templates Seed Data
-- Placeholder templates for all automated transaction emails

-- ============================================================================
-- Listing Side Templates (10)
-- ============================================================================

-- 1. Listing: Opening Escrow Internal Chat
INSERT INTO email_templates (key, name, subject_template, body_html, body_text, audience_type, side, is_active)
VALUES (
  'listing_opening_escrow_chat',
  'Listing: Opening Escrow Chat',
  'New Listing Escrow - {{property_address}}',
  '<p>Hi Team, this is a placeholder for listing_opening_escrow_chat for {{property_address}}. Escrow opening notification for internal coordination.</p>',
  'Hi Team, this is a placeholder for listing_opening_escrow_chat for {{property_address}}. Escrow opening notification for internal coordination.',
  'internal_chat',
  'listing',
  true
) ON CONFLICT (key) DO NOTHING;

-- 2. Listing: New Escrow to Escrow Company
INSERT INTO email_templates (key, name, subject_template, body_html, body_text, audience_type, side, is_active)
VALUES (
  'listing_new_escrow_to_escrow',
  'Listing: New Escrow to Escrow',
  'NEW ESCROW - {{property_address}}',
  '<p>Hi, this is a placeholder for listing_new_escrow_to_escrow for {{property_address}}. COE date: {{estimated_coe_date}}.</p>',
  'Hi, this is a placeholder for listing_new_escrow_to_escrow for {{property_address}}. COE date: {{estimated_coe_date}}.',
  'escrow',
  'listing',
  true
) ON CONFLICT (key) DO NOTHING;

-- 3. Listing: Timeline to All Parties
INSERT INTO email_templates (key, name, subject_template, body_html, body_text, audience_type, side, is_active)
VALUES (
  'listing_new_escrow_timeline_all',
  'Listing: Timeline to All Parties',
  'Transaction Timeline - {{property_address}}',
  '<p>Hi, this is a placeholder for listing_new_escrow_timeline_all for {{property_address}}. Key dates: EMD due {{emd_due_date}}, COE {{estimated_coe_date}}.</p>',
  'Hi, this is a placeholder for listing_new_escrow_timeline_all for {{property_address}}. Key dates: EMD due {{emd_due_date}}, COE {{estimated_coe_date}}.',
  'all_parties',
  'listing',
  true
) ON CONFLICT (key) DO NOTHING;

-- 4. Listing: HOA Docs Update
INSERT INTO email_templates (key, name, subject_template, body_html, body_text, audience_type, side, is_active)
VALUES (
  'listing_hoa_docs_update',
  'Listing: HOA Docs Update',
  'HOA Documents Update - {{property_address}}',
  '<p>Hi, this is a placeholder for listing_hoa_docs_update for {{property_address}}. HOA documentation status update.</p>',
  'Hi, this is a placeholder for listing_hoa_docs_update for {{property_address}}. HOA documentation status update.',
  'escrow',
  'listing',
  true
) ON CONFLICT (key) DO NOTHING;

-- 5. Listing: Solar Transfer Update
INSERT INTO email_templates (key, name, subject_template, body_html, body_text, audience_type, side, is_active)
VALUES (
  'listing_solar_transfer_update',
  'Listing: Solar Transfer Update',
  'Solar Transfer Update - {{property_address}}',
  '<p>Hi, this is a placeholder for listing_solar_transfer_update for {{property_address}}. Solar panel transfer status.</p>',
  'Hi, this is a placeholder for listing_solar_transfer_update for {{property_address}}. Solar panel transfer status.',
  'escrow',
  'listing',
  true
) ON CONFLICT (key) DO NOTHING;

-- 6. Listing: TC Invoice to Escrow
INSERT INTO email_templates (key, name, subject_template, body_html, body_text, audience_type, side, is_active)
VALUES (
  'listing_tc_invoice_to_escrow',
  'Listing: TC Invoice to Escrow',
  'TC Fee Invoice - {{property_address}}',
  '<p>Hi, this is a placeholder for listing_tc_invoice_to_escrow for {{property_address}}. TC fee: {{tc_fee_amount}}, paid by {{tc_fee_payer}}.</p>',
  'Hi, this is a placeholder for listing_tc_invoice_to_escrow for {{property_address}}. TC fee: {{tc_fee_amount}}, paid by {{tc_fee_payer}}.',
  'escrow',
  'listing',
  true
) ON CONFLICT (key) DO NOTHING;

-- 7. Listing: Send Disclosures to Buy Side
INSERT INTO email_templates (key, name, subject_template, body_html, body_text, audience_type, side, is_active)
VALUES (
  'listing_send_disclosures_to_buy_side',
  'Listing: Send Disclosures to Buyer',
  'Seller Disclosures - {{property_address}}',
  '<p>Hi, this is a placeholder for listing_send_disclosures_to_buy_side for {{property_address}}. Seller disclosures attached.</p>',
  'Hi, this is a placeholder for listing_send_disclosures_to_buy_side for {{property_address}}. Seller disclosures attached.',
  'buying_agent',
  'listing',
  true
) ON CONFLICT (key) DO NOTHING;

-- 8. Listing: Contingency Due Today
INSERT INTO email_templates (key, name, subject_template, body_html, body_text, audience_type, side, is_active)
VALUES (
  'listing_contingency_due_today',
  'Listing: Contingency Due Today',
  'Contingency Due Today - {{property_address}}',
  '<p>Hi, this is a placeholder for listing_contingency_due_today for {{property_address}}. Contingency deadline is today.</p>',
  'Hi, this is a placeholder for listing_contingency_due_today for {{property_address}}. Contingency deadline is today.',
  'all_parties',
  'listing',
  true
) ON CONFLICT (key) DO NOTHING;

-- 9. Listing: CDA to Escrow
INSERT INTO email_templates (key, name, subject_template, body_html, body_text, audience_type, side, is_active)
VALUES (
  'listing_cda_to_escrow',
  'Listing: CDA to Escrow',
  'CDA Ready - {{property_address}}',
  '<p>Hi, this is a placeholder for listing_cda_to_escrow for {{property_address}}. CDA prepared and ready for closing.</p>',
  'Hi, this is a placeholder for listing_cda_to_escrow for {{property_address}}. CDA prepared and ready for closing.',
  'escrow',
  'listing',
  true
) ON CONFLICT (key) DO NOTHING;

-- 10. Listing: Request Utilities from Seller
INSERT INTO email_templates (key, name, subject_template, body_html, body_text, audience_type, side, is_active)
VALUES (
  'listing_request_utilities_seller',
  'Listing: Request Utilities from Seller',
  'Utility Information Needed - {{property_address}}',
  '<p>Hi, this is a placeholder for listing_request_utilities_seller for {{property_address}}. Please provide utility account information.</p>',
  'Hi, this is a placeholder for listing_request_utilities_seller for {{property_address}}. Please provide utility account information.',
  'seller',
  'listing',
  true
) ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- Buying Side Templates (14)
-- ============================================================================

-- 1. Buyer: Opening Escrow Internal Chat
INSERT INTO email_templates (key, name, subject_template, body_html, body_text, audience_type, side, is_active)
VALUES (
  'buyer_opening_escrow_chat',
  'Buyer: Opening Escrow Chat',
  'New Buyer Escrow - {{property_address}}',
  '<p>Hi Team, this is a placeholder for buyer_opening_escrow_chat for {{property_address}}. Escrow opening notification for internal coordination.</p>',
  'Hi Team, this is a placeholder for buyer_opening_escrow_chat for {{property_address}}. Escrow opening notification for internal coordination.',
  'internal_chat',
  'buying',
  true
) ON CONFLICT (key) DO NOTHING;

-- 2. Buyer: Congrats to Listing Side
INSERT INTO email_templates (key, name, subject_template, body_html, body_text, audience_type, side, is_active)
VALUES (
  'buyer_congrats_listing_side',
  'Buyer: Congrats to Listing Side',
  'Congratulations - Offer Accepted - {{property_address}}',
  '<p>Hi, this is a placeholder for buyer_congrats_listing_side for {{property_address}}. Offer accepted, moving to escrow.</p>',
  'Hi, this is a placeholder for buyer_congrats_listing_side for {{property_address}}. Offer accepted, moving to escrow.',
  'listing_agent',
  'buying',
  true
) ON CONFLICT (key) DO NOTHING;

-- 3. Buyer: Timeline to All Parties
INSERT INTO email_templates (key, name, subject_template, body_html, body_text, audience_type, side, is_active)
VALUES (
  'buyer_timeline_all',
  'Buyer: Timeline to All Parties',
  'Transaction Timeline - {{property_address}}',
  '<p>Hi, this is a placeholder for buyer_timeline_all for {{property_address}}. Key dates: Inspection {{buyer_investigation_due_date}}, Loan {{buyer_loan_due_date}}, COE {{estimated_coe_date}}.</p>',
  'Hi, this is a placeholder for buyer_timeline_all for {{property_address}}. Key dates: Inspection {{buyer_investigation_due_date}}, Loan {{buyer_loan_due_date}}, COE {{estimated_coe_date}}.',
  'all_parties',
  'buying',
  true
) ON CONFLICT (key) DO NOTHING;

-- 4. Buyer: Inspection Scheduled to Listing
INSERT INTO email_templates (key, name, subject_template, body_html, body_text, audience_type, side, is_active)
VALUES (
  'buyer_inspection_scheduled_to_listing',
  'Buyer: Inspection Scheduled',
  'Inspection Scheduled - {{property_address}}',
  '<p>Hi, this is a placeholder for buyer_inspection_scheduled_to_listing for {{property_address}}. Inspection scheduled for {{inspection_scheduled_at}}.</p>',
  'Hi, this is a placeholder for buyer_inspection_scheduled_to_listing for {{property_address}}. Inspection scheduled for {{inspection_scheduled_at}}.',
  'listing_agent',
  'buying',
  true
) ON CONFLICT (key) DO NOTHING;

-- 5. Buyer: Executed Contract to Lender
INSERT INTO email_templates (key, name, subject_template, body_html, body_text, audience_type, side, is_active)
VALUES (
  'buyer_executed_contract_to_lender',
  'Buyer: Executed Contract to Lender',
  'Executed Contract - {{property_address}}',
  '<p>Hi, this is a placeholder for buyer_executed_contract_to_lender for {{property_address}}. Executed contract attached for loan processing.</p>',
  'Hi, this is a placeholder for buyer_executed_contract_to_lender for {{property_address}}. Executed contract attached for loan processing.',
  'lender',
  'buying',
  true
) ON CONFLICT (key) DO NOTHING;

-- 6. Buyer: Loan Appraisal Update
INSERT INTO email_templates (key, name, subject_template, body_html, body_text, audience_type, side, is_active)
VALUES (
  'buyer_loan_appraisal_update',
  'Buyer: Loan Appraisal Update',
  'Appraisal Update - {{property_address}}',
  '<p>Hi, this is a placeholder for buyer_loan_appraisal_update for {{property_address}}. Appraisal status update.</p>',
  'Hi, this is a placeholder for buyer_loan_appraisal_update for {{property_address}}. Appraisal status update.',
  'lender',
  'buying',
  true
) ON CONFLICT (key) DO NOTHING;

-- 7. Buyer: HOA Docs Update
INSERT INTO email_templates (key, name, subject_template, body_html, body_text, audience_type, side, is_active)
VALUES (
  'buyer_hoa_docs_update',
  'Buyer: HOA Docs Update',
  'HOA Documents Update - {{property_address}}',
  '<p>Hi, this is a placeholder for buyer_hoa_docs_update for {{property_address}}. HOA documentation status update.</p>',
  'Hi, this is a placeholder for buyer_hoa_docs_update for {{property_address}}. HOA documentation status update.',
  'lender',
  'buying',
  true
) ON CONFLICT (key) DO NOTHING;

-- 8. Buyer: Solar Transfer Update
INSERT INTO email_templates (key, name, subject_template, body_html, body_text, audience_type, side, is_active)
VALUES (
  'buyer_solar_transfer_update',
  'Buyer: Solar Transfer Update',
  'Solar Transfer Update - {{property_address}}',
  '<p>Hi, this is a placeholder for buyer_solar_transfer_update for {{property_address}}. Solar panel transfer status.</p>',
  'Hi, this is a placeholder for buyer_solar_transfer_update for {{property_address}}. Solar panel transfer status.',
  'buyer',
  'buying',
  true
) ON CONFLICT (key) DO NOTHING;

-- 9. Buyer: TC Invoice to Escrow
INSERT INTO email_templates (key, name, subject_template, body_html, body_text, audience_type, side, is_active)
VALUES (
  'buyer_tc_invoice_to_escrow',
  'Buyer: TC Invoice to Escrow',
  'TC Fee Invoice - {{property_address}}',
  '<p>Hi, this is a placeholder for buyer_tc_invoice_to_escrow for {{property_address}}. TC fee: {{tc_fee_amount}}, paid by {{tc_fee_payer}}.</p>',
  'Hi, this is a placeholder for buyer_tc_invoice_to_escrow for {{property_address}}. TC fee: {{tc_fee_amount}}, paid by {{tc_fee_payer}}.',
  'escrow',
  'buying',
  true
) ON CONFLICT (key) DO NOTHING;

-- 10. Buyer: Seller Disclosures Followup
INSERT INTO email_templates (key, name, subject_template, body_html, body_text, audience_type, side, is_active)
VALUES (
  'buyer_seller_disclosures_followup',
  'Buyer: Seller Disclosures Followup',
  'Seller Disclosures Reminder - {{property_address}}',
  '<p>Hi, this is a placeholder for buyer_seller_disclosures_followup for {{property_address}}. Seller disclosures due {{seller_disclosures_due_date}}.</p>',
  'Hi, this is a placeholder for buyer_seller_disclosures_followup for {{property_address}}. Seller disclosures due {{seller_disclosures_due_date}}.',
  'listing_agent',
  'buying',
  true
) ON CONFLICT (key) DO NOTHING;

-- 11. Buyer: CDA to Escrow
INSERT INTO email_templates (key, name, subject_template, body_html, body_text, audience_type, side, is_active)
VALUES (
  'buyer_cda_to_escrow',
  'Buyer: CDA to Escrow',
  'CDA Ready - {{property_address}}',
  '<p>Hi, this is a placeholder for buyer_cda_to_escrow for {{property_address}}. CDA prepared and ready for closing.</p>',
  'Hi, this is a placeholder for buyer_cda_to_escrow for {{property_address}}. CDA prepared and ready for closing.',
  'escrow',
  'buying',
  true
) ON CONFLICT (key) DO NOTHING;

-- 12. Buyer: Upcoming Closing Update
INSERT INTO email_templates (key, name, subject_template, body_html, body_text, audience_type, side, is_active)
VALUES (
  'buyer_upcoming_closing_update',
  'Buyer: Upcoming Closing Update',
  'Closing Soon - {{property_address}}',
  '<p>Hi, this is a placeholder for buyer_upcoming_closing_update for {{property_address}}. Closing scheduled for {{estimated_coe_date}}.</p>',
  'Hi, this is a placeholder for buyer_upcoming_closing_update for {{property_address}}. Closing scheduled for {{estimated_coe_date}}.',
  'buyer',
  'buying',
  true
) ON CONFLICT (key) DO NOTHING;

-- 13. Buyer: MLS Reporting
INSERT INTO email_templates (key, name, subject_template, body_html, body_text, audience_type, side, is_active)
VALUES (
  'buyer_mls_reporting',
  'Buyer: MLS Reporting',
  'MLS Status Update - {{property_address}}',
  '<p>Hi, this is a placeholder for buyer_mls_reporting for {{property_address}}. MLS reporting update.</p>',
  'Hi, this is a placeholder for buyer_mls_reporting for {{property_address}}. MLS reporting update.',
  'listing_agent',
  'buying',
  true
) ON CONFLICT (key) DO NOTHING;

-- 14. Buyer: Request Utilities from Listing
INSERT INTO email_templates (key, name, subject_template, body_html, body_text, audience_type, side, is_active)
VALUES (
  'buyer_request_utilities_from_listing',
  'Buyer: Request Utilities from Listing',
  'Utility Information Request - {{property_address}}',
  '<p>Hi, this is a placeholder for buyer_request_utilities_from_listing for {{property_address}}. Please provide utility account information.</p>',
  'Hi, this is a placeholder for buyer_request_utilities_from_listing for {{property_address}}. Please provide utility account information.',
  'listing_agent',
  'buying',
  true
) ON CONFLICT (key) DO NOTHING;

