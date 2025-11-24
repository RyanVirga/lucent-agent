// Recipient Resolver
// Resolves email recipients based on deal and audience type

import { supabaseAdmin } from '@/server/db/supabaseClient'
import type { Deal, AudienceType } from '@/types/database'
import type { EmailRecipient } from './emailService'

/**
 * Resolve email recipients based on deal and audience type
 * Returns array of email/name pairs
 * Logs warnings for missing data but continues
 */
export async function resolveRecipients(
  deal: Deal,
  audienceType: AudienceType | null
): Promise<EmailRecipient[]> {
  if (!audienceType) {
    console.warn(`[Recipient Resolver] No audience type specified for deal ${deal.id}`)
    return []
  }
  
  console.log(`[Recipient Resolver] Resolving ${audienceType} for deal ${deal.id}`)
  
  try {
    switch (audienceType) {
      case 'escrow':
        return await getEscrowEmail(deal.escrow_company_id)
        
      case 'lender':
        return await getLenderEmail(deal.lender_id)
        
      case 'listing_agent':
        return await getListingAgentEmail(deal)
        
      case 'buying_agent':
        return await getBuyingAgentEmail(deal)
        
      case 'seller':
        return await getPartyEmails(deal.id, 'seller')
        
      case 'buyer':
        return await getPartyEmails(deal.id, 'buyer')
        
      case 'all_parties':
        return await getAllPartiesEmails(deal)
        
      case 'internal_chat':
        // Internal chat doesn't have email recipients
        return []
        
      default:
        console.warn(`[Recipient Resolver] Unknown audience type: ${audienceType}`)
        return []
    }
  } catch (error) {
    console.error(`[Recipient Resolver] Error resolving ${audienceType}:`, error)
    return []
  }
}

/**
 * Get escrow company email
 */
async function getEscrowEmail(escrowCompanyId: string | null): Promise<EmailRecipient[]> {
  if (!escrowCompanyId) {
    console.warn('[Recipient Resolver] No escrow company ID provided')
    return []
  }
  
  const { data, error } = await supabaseAdmin
    .from('escrow_companies')
    .select('name, email')
    .eq('id', escrowCompanyId)
    .single()
  
  if (error || !data || !data.email) {
    console.warn(`[Recipient Resolver] Escrow company ${escrowCompanyId} has no email`)
    return []
  }
  
  return [{ email: data.email, name: data.name }]
}

/**
 * Get lender email
 */
async function getLenderEmail(lenderId: string | null): Promise<EmailRecipient[]> {
  if (!lenderId) {
    console.warn('[Recipient Resolver] No lender ID provided')
    return []
  }
  
  const { data, error } = await supabaseAdmin
    .from('lenders')
    .select('name, email, loan_officer_name')
    .eq('id', lenderId)
    .single()
  
  if (error || !data || !data.email) {
    console.warn(`[Recipient Resolver] Lender ${lenderId} has no email`)
    return []
  }
  
  return [{ 
    email: data.email, 
    name: data.loan_officer_name || data.name 
  }]
}

/**
 * Get listing agent email
 * For listing side deals, the primary agent is the listing agent
 * For buying side deals, need to find listing agent from deal_parties
 */
async function getListingAgentEmail(deal: Deal): Promise<EmailRecipient[]> {
  if (deal.side === 'listing' && deal.primary_agent_id) {
    return await getAgentEmail(deal.primary_agent_id)
  }
  
  // For buying side, look for listing agent in deal_parties
  const { data, error } = await supabaseAdmin
    .from('deal_parties')
    .select('name, email')
    .eq('deal_id', deal.id)
    .eq('role', 'listing_agent')
    .limit(1)
  
  if (error || !data || data.length === 0 || !data[0].email) {
    console.warn(`[Recipient Resolver] No listing agent found for deal ${deal.id}`)
    return []
  }
  
  return [{ email: data[0].email, name: data[0].name }]
}

/**
 * Get buying agent email
 * For buying side deals, the primary agent is the buying agent
 * For listing side deals, need to find buying agent from deal_parties
 */
async function getBuyingAgentEmail(deal: Deal): Promise<EmailRecipient[]> {
  if (deal.side === 'buying' && deal.primary_agent_id) {
    return await getAgentEmail(deal.primary_agent_id)
  }
  
  // For listing side, look for buying agent in deal_parties
  const { data, error } = await supabaseAdmin
    .from('deal_parties')
    .select('name, email')
    .eq('deal_id', deal.id)
    .eq('role', 'buyer_agent')
    .limit(1)
  
  if (error || !data || data.length === 0 || !data[0].email) {
    console.warn(`[Recipient Resolver] No buying agent found for deal ${deal.id}`)
    return []
  }
  
  return [{ email: data[0].email, name: data[0].name }]
}

/**
 * Get agent email from profiles table
 */
async function getAgentEmail(agentId: string): Promise<EmailRecipient[]> {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('email, first_name, last_name')
    .eq('id', agentId)
    .single()
  
  if (error || !data || !data.email) {
    console.warn(`[Recipient Resolver] Agent ${agentId} has no email`)
    return []
  }
  
  const name = [data.first_name, data.last_name].filter(Boolean).join(' ') || undefined
  return [{ email: data.email, name }]
}

/**
 * Get party emails by role (buyer or seller)
 */
async function getPartyEmails(dealId: string, role: 'buyer' | 'seller'): Promise<EmailRecipient[]> {
  const { data, error } = await supabaseAdmin
    .from('deal_parties')
    .select('name, email')
    .eq('deal_id', dealId)
    .eq('role', role)
  
  if (error || !data) {
    console.warn(`[Recipient Resolver] Error fetching ${role} parties for deal ${dealId}`)
    return []
  }
  
  return data
    .filter(p => p.email)
    .map(p => ({ email: p.email!, name: p.name }))
}

/**
 * Get all parties involved in the deal
 * Includes: agents, TC, escrow, lender
 */
async function getAllPartiesEmails(deal: Deal): Promise<EmailRecipient[]> {
  const recipients: EmailRecipient[] = []
  
  // Get both agents
  const listingAgent = await getListingAgentEmail(deal)
  const buyingAgent = await getBuyingAgentEmail(deal)
  recipients.push(...listingAgent, ...buyingAgent)
  
  // Get escrow
  const escrow = await getEscrowEmail(deal.escrow_company_id)
  recipients.push(...escrow)
  
  // Get lender
  const lender = await getLenderEmail(deal.lender_id)
  recipients.push(...lender)
  
  // Deduplicate by email
  const uniqueRecipients = recipients.reduce((acc, curr) => {
    if (!acc.find(r => r.email === curr.email)) {
      acc.push(curr)
    }
    return acc
  }, [] as EmailRecipient[])
  
  return uniqueRecipients
}

