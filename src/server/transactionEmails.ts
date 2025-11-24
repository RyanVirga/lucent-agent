// Transaction Email Sending
// Core function for sending automated transaction emails with deduplication

import { supabaseAdmin } from '@/server/db/supabaseClient'
import type { Deal, EmailTemplate } from '@/types/database'
import { buildTemplateData, renderEmailTemplate } from './lib/templateRenderer'
import { sendEmail } from './lib/emailService'
import { resolveRecipients } from './lib/recipientResolver'

export interface SendTransactionEmailParams {
  dealId: string
  templateKey: string
  contextDate?: string | null
}

export interface SendTransactionEmailResult {
  success: boolean
  sent: boolean
  skipped: boolean
  error?: string
  reason?: string
}

/**
 * Send a transaction email
 * 
 * Steps:
 * 1. Fetch deal and template
 * 2. Check for duplicates in transaction_email_log
 * 3. Resolve recipients based on audience_type
 * 4. Render template with deal data
 * 5. Send email or log internal chat
 * 6. Insert log entry
 * 
 * Never throws - returns result object with detailed status
 * Logs extensively for debugging
 */
export async function sendTransactionEmail(
  params: SendTransactionEmailParams
): Promise<SendTransactionEmailResult> {
  const { dealId, templateKey, contextDate } = params
  
  console.log(`[Transaction Email] Processing ${templateKey} for deal ${dealId}`, 
    contextDate ? `(context: ${contextDate})` : '')
  
  try {
    // Step 1: Fetch deal
    const { data: deal, error: dealError } = await supabaseAdmin
      .from('deals')
      .select('*')
      .eq('id', dealId)
      .single()
    
    if (dealError || !deal) {
      const error = `Deal not found: ${dealId}`
      console.error(`[Transaction Email] ${error}`)
      return { success: false, sent: false, skipped: false, error }
    }
    
    // Step 2: Fetch template
    const { data: template, error: templateError } = await supabaseAdmin
      .from('email_templates')
      .select('*')
      .eq('key', templateKey)
      .eq('is_active', true)
      .single()
    
    if (templateError || !template) {
      const error = `Template not found or inactive: ${templateKey}`
      console.error(`[Transaction Email] ${error}`)
      return { success: false, sent: false, skipped: false, error }
    }
    
    // Step 3: Check for duplicates
    const { data: existingLog } = await supabaseAdmin
      .from('transaction_email_log')
      .select('id')
      .eq('deal_id', dealId)
      .eq('template_key', templateKey)
      .eq('context_date', contextDate || null)
      .limit(1)
    
    if (existingLog && existingLog.length > 0) {
      const reason = `Already sent (log id: ${existingLog[0].id})`
      console.log(`[Transaction Email] ${reason}`)
      return { success: true, sent: false, skipped: true, reason }
    }
    
    // Step 4: Handle internal chat (no email sent)
    if (template.audience_type === 'internal_chat') {
      return await handleInternalChat(deal, template, templateKey, contextDate)
    }
    
    // Step 5: Resolve recipients
    const recipients = await resolveRecipients(deal, template.audience_type)
    
    if (recipients.length === 0) {
      const reason = `No recipients found for ${template.audience_type}`
      console.warn(`[Transaction Email] ${reason}`)
      
      // Log as failed so we don't keep trying
      await logEmailSend(dealId, templateKey, contextDate, 'failed', [], reason)
      
      return { success: true, sent: false, skipped: true, reason }
    }
    
    // Step 6: Render template
    const templateData = buildTemplateData(deal, {
      template_key: templateKey,
      // Add recipient names for personalization
      recipient_names: recipients.map(r => r.name).filter(Boolean).join(', '),
    })
    
    const { subject, body } = renderEmailTemplate(
      template.subject_template,
      template.body_html,
      templateData
    )
    
    // Step 7: Send email
    const emailResult = await sendEmail({
      to: recipients,
      subject,
      html: body,
      text: template.body_text || undefined,
    })
    
    if (!emailResult.success) {
      console.error(`[Transaction Email] Failed to send:`, emailResult.error)
      
      // Log failure
      await logEmailSend(
        dealId, 
        templateKey, 
        contextDate, 
        'failed',
        recipients.map(r => r.email),
        emailResult.error
      )
      
      // Create alert for team
      await createFailureAlert(deal, templateKey, emailResult.error)
      
      return { 
        success: false, 
        sent: false, 
        skipped: false, 
        error: emailResult.error 
      }
    }
    
    // Step 8: Log successful send
    await logEmailSend(
      dealId, 
      templateKey, 
      contextDate, 
      'sent',
      recipients.map(r => r.email)
    )
    
    console.log(`[Transaction Email] ✓ Sent ${templateKey} to ${recipients.length} recipient(s)`)
    
    return { success: true, sent: true, skipped: false }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[Transaction Email] Exception:`, error)
    
    // Don't throw - return error result
    return { 
      success: false, 
      sent: false, 
      skipped: false, 
      error: errorMessage 
    }
  }
}

/**
 * Handle internal chat notification
 * Logs to timeline events instead of sending email
 */
async function handleInternalChat(
  deal: Deal,
  template: EmailTemplate,
  templateKey: string,
  contextDate: string | null | undefined
): Promise<SendTransactionEmailResult> {
  try {
    // Render message for chat
    const templateData = buildTemplateData(deal, { template_key: templateKey })
    const { subject, body } = renderEmailTemplate(
      template.subject_template,
      template.body_text || template.body_html,
      templateData
    )
    
    // Log to timeline
    await supabaseAdmin.from('deal_timeline_events').insert({
      deal_id: deal.id,
      event_type: 'internal_chat',
      description: subject,
      metadata: {
        template_key: templateKey,
        message: body,
        context_date: contextDate,
      },
      created_by: null, // System-created
    })
    
    // Log as sent (even though no email)
    await logEmailSend(deal.id, templateKey, contextDate, 'sent', [])
    
    console.log(`[Transaction Email] ✓ Logged internal chat: ${templateKey}`)
    
    return { success: true, sent: true, skipped: false }
    
  } catch (error) {
    console.error('[Transaction Email] Failed to log internal chat:', error)
    return { 
      success: false, 
      sent: false, 
      skipped: false, 
      error: error instanceof Error ? error.message : 'Failed to log internal chat'
    }
  }
}

/**
 * Log email send to transaction_email_log
 */
async function logEmailSend(
  dealId: string,
  templateKey: string,
  contextDate: string | null | undefined,
  status: 'sent' | 'failed',
  recipientEmails: string[],
  errorMessage?: string
): Promise<void> {
  try {
    await supabaseAdmin.from('transaction_email_log').insert({
      deal_id: dealId,
      template_key: templateKey,
      context_date: contextDate || null,
      status,
      recipient_emails: recipientEmails.length > 0 ? recipientEmails : null,
      error_message: errorMessage || null,
    })
  } catch (error) {
    // Log insert failures shouldn't break the flow
    console.error('[Transaction Email] Failed to insert log:', error)
  }
}

/**
 * Create an alert for failed email
 */
async function createFailureAlert(
  deal: Deal,
  templateKey: string,
  errorMessage?: string
): Promise<void> {
  try {
    await supabaseAdmin.from('alerts').insert({
      deal_id: deal.id,
      type: 'overdue_task', // Closest existing type
      level: 'warning',
      message: `Failed to send ${templateKey} email: ${errorMessage || 'Unknown error'}`,
      is_read: false,
    })
  } catch (error) {
    // Alert creation failures shouldn't break the flow
    console.error('[Transaction Email] Failed to create alert:', error)
  }
}

/**
 * Batch send multiple emails
 * Useful for testing or bulk operations
 * Returns summary of results
 */
export async function sendTransactionEmailBatch(
  emails: SendTransactionEmailParams[]
): Promise<{
  total: number
  sent: number
  skipped: number
  failed: number
  results: SendTransactionEmailResult[]
}> {
  const results = await Promise.all(
    emails.map(params => sendTransactionEmail(params))
  )
  
  return {
    total: results.length,
    sent: results.filter(r => r.sent).length,
    skipped: results.filter(r => r.skipped).length,
    failed: results.filter(r => !r.success).length,
    results,
  }
}

