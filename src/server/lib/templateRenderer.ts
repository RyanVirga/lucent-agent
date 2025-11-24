// Template Rendering Utility using Handlebars
// Safely renders email templates with deal data

import Handlebars from 'handlebars'
import type { Deal } from '@/types/database'

// Register custom Handlebars helpers
Handlebars.registerHelper('formatDate', function (dateString: string | null | undefined) {
  if (!dateString) return 'TBD'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  } catch {
    return 'TBD'
  }
})

Handlebars.registerHelper('formatDateTime', function (dateString: string | null | undefined) {
  if (!dateString) return 'TBD'
  try {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  } catch {
    return 'TBD'
  }
})

Handlebars.registerHelper('formatCurrency', function (amount: number | null | undefined) {
  if (amount === null || amount === undefined) return 'TBD'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
})

Handlebars.registerHelper('uppercase', function (str: string | null | undefined) {
  if (!str) return ''
  return str.toUpperCase()
})

Handlebars.registerHelper('capitalize', function (str: string | null | undefined) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
})

/**
 * Build template data object from deal with sensible defaults
 */
export function buildTemplateData(deal: Deal, additionalData: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    // Deal basic info
    property_address: deal.property_address || 'Property Address TBD',
    deal_id: deal.id,
    side: deal.side,
    status: deal.status,
    price: deal.price,
    
    // Dates
    offer_acceptance_date: deal.offer_acceptance_date,
    close_date: deal.close_date,
    coe_date: deal.coe_date,
    estimated_coe_date: deal.estimated_coe_date || deal.coe_date,
    possession_date: deal.possession_date,
    
    // EMD
    emd_amount: deal.emd_amount,
    emd_due_date: deal.emd_due_date,
    emd_received_at: deal.emd_received_at,
    
    // Inspection
    inspection_deadline: deal.inspection_deadline,
    inspection_scheduled_at: deal.inspection_scheduled_at,
    buyer_investigation_due_date: deal.buyer_investigation_due_date,
    inspection_contingency_removed_at: deal.inspection_contingency_removed_at,
    
    // Disclosures
    seller_disclosures_due_date: deal.seller_disclosures_due_date,
    seller_disclosures_sent_at: deal.seller_disclosures_sent_at,
    buyer_disclosures_signed_at: deal.buyer_disclosures_signed_at,
    
    // Loan
    loan_type: deal.loan_type,
    down_payment_percent: deal.down_payment_percent,
    buyer_appraisal_due_date: deal.buyer_appraisal_due_date,
    buyer_loan_due_date: deal.buyer_loan_due_date,
    buyer_insurance_due_date: deal.buyer_insurance_due_date,
    appraisal_ordered_at: deal.appraisal_ordered_at,
    
    // Property features
    has_hoa: deal.has_hoa,
    has_solar: deal.has_solar,
    hoa_docs_received_at: deal.hoa_docs_received_at,
    
    // TC fees
    tc_fee_amount: deal.tc_fee_amount,
    tc_fee_payer: deal.tc_fee_payer,
    
    // Closing
    cda_prepared_at: deal.cda_prepared_at,
    cda_sent_to_escrow_at: deal.cda_sent_to_escrow_at,
    closed_at: deal.closed_at,
    
    // Additional data passed in (e.g., party names, custom fields)
    ...additionalData,
  }
}

/**
 * Render a template string with data using Handlebars
 * Handles errors gracefully and returns error message if rendering fails
 */
export function renderTemplate(templateString: string, data: Record<string, unknown>): string {
  try {
    const template = Handlebars.compile(templateString)
    return template(data)
  } catch (error) {
    console.error('Template rendering error:', error)
    return `[Template Error: ${error instanceof Error ? error.message : 'Unknown error'}]`
  }
}

/**
 * Render both subject and body templates
 * Returns object with rendered subject and body
 */
export function renderEmailTemplate(
  subjectTemplate: string,
  bodyTemplate: string,
  data: Record<string, unknown>
): { subject: string; body: string } {
  return {
    subject: renderTemplate(subjectTemplate, data),
    body: renderTemplate(bodyTemplate, data),
  }
}

