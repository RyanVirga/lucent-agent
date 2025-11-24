// Transaction Email Rules Engine
// Defines business logic for when to send automated emails

import { supabaseAdmin } from '@/server/db/supabaseClient'
import type { Deal } from '@/types/database'
import { sendTransactionEmail } from './transactionEmails'
import { getTodayInPacific, daysUntil, daysSince, isSameDay } from './lib/dateUtils'

/**
 * Run immediate email rules for a deal
 * Called when deal changes status or key events occur
 */
export async function runImmediateEmailRulesForDeal(dealId: string): Promise<void> {
  console.log(`[Email Rules] Running immediate rules for deal ${dealId}`)
  
  try {
    // Fetch the deal
    const { data: deal, error } = await supabaseAdmin
      .from('deals')
      .select('*')
      .eq('id', dealId)
      .single()
    
    if (error || !deal) {
      console.error(`[Email Rules] Deal not found: ${dealId}`)
      return
    }
    
    // Run immediate rule functions
    await maybeSendOpeningEscrowEmails(deal)
    await maybeSendInspectionScheduledEmail(deal)
    
  } catch (error) {
    console.error(`[Email Rules] Error running immediate rules:`, error)
  }
}

/**
 * Run daily email rules for all active deals
 * Called by cron job
 */
export async function runDailyEmailRules(): Promise<{
  considered: number
  sent: number
  skipped: number
  failed: number
}> {
  console.log(`[Email Rules] Running daily email rules`)
  const today = getTodayInPacific()
  
  const stats = {
    considered: 0,
    sent: 0,
    skipped: 0,
    failed: 0,
  }
  
  try {
    // Fetch all active deals in escrow or near closing
    const { data: deals, error } = await supabaseAdmin
      .from('deals')
      .select('*')
      .in('status', ['in_escrow', 'pending_contingencies', 'pending', 'pending_coe'])
    
    if (error || !deals) {
      console.error(`[Email Rules] Error fetching deals:`, error)
      return stats
    }
    
    stats.considered = deals.length
    console.log(`[Email Rules] Found ${deals.length} active deals`)
    
    // Run daily rules for each deal
    for (const deal of deals) {
      const dealStats = await runDailyRulesForDeal(deal, today)
      stats.sent += dealStats.sent
      stats.skipped += dealStats.skipped
      stats.failed += dealStats.failed
    }
    
    console.log(`[Email Rules] Daily rules complete:`, stats)
    return stats
    
  } catch (error) {
    console.error(`[Email Rules] Error running daily rules:`, error)
    return stats
  }
}

/**
 * Run all daily rules for a single deal
 */
async function runDailyRulesForDeal(
  deal: Deal, 
  today: string
): Promise<{ sent: number; skipped: number; failed: number }> {
  const stats = { sent: 0, skipped: 0, failed: 0 }
  
  // Run all daily rule functions
  const results = await Promise.all([
    maybeSendHoaDocsUpdate(deal, today),
    maybeSendSolarTransferUpdate(deal, today),
    maybeSendSellerDisclosuresFollowup(deal, today),
    maybeSendContingencyDueToday(deal, today),
    maybeSendCdaReminders(deal, today),
    maybeSendUpcomingClosingUpdate(deal, today),
    maybeSendUtilityRequests(deal, today),
  ])
  
  // Aggregate results
  for (const result of results) {
    if (result.sent) stats.sent++
    else if (result.skipped) stats.skipped++
    else if (!result.success) stats.failed++
  }
  
  return stats
}

// ============================================================================
// Immediate Rules
// ============================================================================

/**
 * Send opening escrow emails when deal enters escrow
 */
async function maybeSendOpeningEscrowEmails(deal: Deal) {
  if (deal.status !== 'in_escrow') {
    return
  }
  
  console.log(`[Email Rules] Checking opening escrow emails for ${deal.id}`)
  
  if (deal.side === 'listing') {
    // Listing side opening escrow emails
    await sendTransactionEmail({
      dealId: deal.id,
      templateKey: 'listing_opening_escrow_chat',
    })
    
    if (deal.escrow_company_id) {
      await sendTransactionEmail({
        dealId: deal.id,
        templateKey: 'listing_new_escrow_to_escrow',
      })
    }
    
    // Send timeline if key dates are present
    if (deal.estimated_coe_date || deal.emd_due_date) {
      await sendTransactionEmail({
        dealId: deal.id,
        templateKey: 'listing_new_escrow_timeline_all',
      })
    }
  } else if (deal.side === 'buying') {
    // Buying side opening escrow emails
    await sendTransactionEmail({
      dealId: deal.id,
      templateKey: 'buyer_opening_escrow_chat',
    })
    
    await sendTransactionEmail({
      dealId: deal.id,
      templateKey: 'buyer_congrats_listing_side',
    })
    
    // Send timeline if key dates are present
    if (deal.estimated_coe_date || deal.buyer_investigation_due_date) {
      await sendTransactionEmail({
        dealId: deal.id,
        templateKey: 'buyer_timeline_all',
      })
    }
  }
}

/**
 * Send inspection scheduled notification
 */
async function maybeSendInspectionScheduledEmail(deal: Deal) {
  if (deal.side !== 'buying' || !deal.inspection_scheduled_at) {
    return
  }
  
  console.log(`[Email Rules] Inspection scheduled for ${deal.id}`)
  
  await sendTransactionEmail({
    dealId: deal.id,
    templateKey: 'buyer_inspection_scheduled_to_listing',
  })
}

// ============================================================================
// Daily Rules
// ============================================================================

/**
 * Listing: HOA documents update
 * Send if has HOA, docs not received, and 5+ days since offer acceptance
 */
async function maybeSendHoaDocsUpdate(deal: Deal, today: string) {
  if (deal.side !== 'listing' || !deal.has_hoa) {
    return { success: true, sent: false, skipped: true }
  }
  
  if (deal.hoa_docs_received_at) {
    return { success: true, sent: false, skipped: true }
  }
  
  if (!deal.offer_acceptance_date) {
    return { success: true, sent: false, skipped: true }
  }
  
  const daysSinceOffer = daysSince(deal.offer_acceptance_date, today)
  if (daysSinceOffer <= 5) {
    return { success: true, sent: false, skipped: true }
  }
  
  console.log(`[Email Rules] Sending HOA docs update for ${deal.id} (${daysSinceOffer} days since offer)`)
  
  return await sendTransactionEmail({
    dealId: deal.id,
    templateKey: 'listing_hoa_docs_update',
    contextDate: today,
  })
}

/**
 * Solar transfer update
 * Send if has solar and 7+ days since offer acceptance
 */
async function maybeSendSolarTransferUpdate(deal: Deal, today: string) {
  if (!deal.has_solar || !deal.offer_acceptance_date) {
    return { success: true, sent: false, skipped: true }
  }
  
  const daysSinceOffer = daysSince(deal.offer_acceptance_date, today)
  if (daysSinceOffer <= 7) {
    return { success: true, sent: false, skipped: true }
  }
  
  console.log(`[Email Rules] Sending solar update for ${deal.id}`)
  
  const templateKey = deal.side === 'listing' 
    ? 'listing_solar_transfer_update' 
    : 'buyer_solar_transfer_update'
  
  return await sendTransactionEmail({
    dealId: deal.id,
    templateKey,
    contextDate: today,
  })
}

/**
 * Buyer: Seller disclosures followup
 * Send 3 days before due date if not received
 */
async function maybeSendSellerDisclosuresFollowup(deal: Deal, today: string) {
  if (deal.side !== 'buying' || !deal.seller_disclosures_due_date) {
    return { success: true, sent: false, skipped: true }
  }
  
  if (deal.seller_disclosures_sent_at) {
    return { success: true, sent: false, skipped: true }
  }
  
  const daysUntilDue = daysUntil(deal.seller_disclosures_due_date, today)
  if (daysUntilDue !== 3) {
    return { success: true, sent: false, skipped: true }
  }
  
  console.log(`[Email Rules] Sending seller disclosures followup for ${deal.id}`)
  
  return await sendTransactionEmail({
    dealId: deal.id,
    templateKey: 'buyer_seller_disclosures_followup',
    contextDate: deal.seller_disclosures_due_date,
  })
}

/**
 * Listing: Contingency due today
 * Send for each contingency deadline that equals today
 */
async function maybeSendContingencyDueToday(deal: Deal, today: string) {
  if (deal.side !== 'listing') {
    return { success: true, sent: false, skipped: true }
  }
  
  // Check various contingency dates
  const contingencyDates = [
    deal.buyer_investigation_due_date,
    deal.buyer_appraisal_due_date,
    deal.buyer_loan_due_date,
    deal.buyer_insurance_due_date,
  ].filter(Boolean)
  
  for (const date of contingencyDates) {
    if (date && isSameDay(date, today)) {
      console.log(`[Email Rules] Contingency due today for ${deal.id}: ${date}`)
      
      await sendTransactionEmail({
        dealId: deal.id,
        templateKey: 'listing_contingency_due_today',
        contextDate: date,
      })
    }
  }
  
  return { success: true, sent: false, skipped: true }
}

/**
 * CDA reminders
 * Send 5 days before COE if not sent
 */
async function maybeSendCdaReminders(deal: Deal, today: string) {
  if (!deal.estimated_coe_date || deal.cda_sent_to_escrow_at) {
    return { success: true, sent: false, skipped: true }
  }
  
  const daysUntilCoe = daysUntil(deal.estimated_coe_date, today)
  if (daysUntilCoe !== 5) {
    return { success: true, sent: false, skipped: true }
  }
  
  console.log(`[Email Rules] Sending CDA reminder for ${deal.id}`)
  
  const templateKey = deal.side === 'listing' 
    ? 'listing_cda_to_escrow' 
    : 'buyer_cda_to_escrow'
  
  return await sendTransactionEmail({
    dealId: deal.id,
    templateKey,
    contextDate: deal.estimated_coe_date,
  })
}

/**
 * Buyer: Upcoming closing update
 * Send 3 days before COE
 */
async function maybeSendUpcomingClosingUpdate(deal: Deal, today: string) {
  if (deal.side !== 'buying' || !deal.estimated_coe_date) {
    return { success: true, sent: false, skipped: true }
  }
  
  const daysUntilCoe = daysUntil(deal.estimated_coe_date, today)
  if (daysUntilCoe !== 3) {
    return { success: true, sent: false, skipped: true }
  }
  
  console.log(`[Email Rules] Sending upcoming closing update for ${deal.id}`)
  
  return await sendTransactionEmail({
    dealId: deal.id,
    templateKey: 'buyer_upcoming_closing_update',
    contextDate: deal.estimated_coe_date,
  })
}

/**
 * Utility information requests
 * Send 5 days or less until COE
 */
async function maybeSendUtilityRequests(deal: Deal, today: string) {
  if (!deal.estimated_coe_date) {
    return { success: true, sent: false, skipped: true }
  }
  
  const daysUntilCoe = daysUntil(deal.estimated_coe_date, today)
  if (daysUntilCoe > 5 || daysUntilCoe < 0) {
    return { success: true, sent: false, skipped: true }
  }
  
  console.log(`[Email Rules] Sending utility request for ${deal.id}`)
  
  const templateKey = deal.side === 'listing'
    ? 'listing_request_utilities_seller'
    : 'buyer_request_utilities_from_listing'
  
  return await sendTransactionEmail({
    dealId: deal.id,
    templateKey,
    contextDate: deal.estimated_coe_date,
  })
}

