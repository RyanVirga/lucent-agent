// Email Service using Resend
// Handles actual email sending with proper error handling

import { Resend } from 'resend'

// Initialize Resend client
let resendClient: Resend | null = null

/**
 * Get or initialize the Resend client
 * Validates that API key is configured
 */
function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY
    
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set')
    }
    
    resendClient = new Resend(apiKey)
  }
  
  return resendClient
}

/**
 * Get the "from" email address
 * Uses configured address or defaults for testing
 */
function getFromAddress(): string {
  const fromAddress = process.env.EMAIL_FROM_ADDRESS
  const fromName = process.env.EMAIL_FROM_NAME || 'TC Team'
  
  if (!fromAddress) {
    // In development, log warning but continue
    if (process.env.NODE_ENV === 'development') {
      console.warn('EMAIL_FROM_ADDRESS not set, using default')
      return 'TC Team <onboarding@resend.dev>' // Resend test address
    }
    throw new Error('EMAIL_FROM_ADDRESS environment variable is not set')
  }
  
  return `${fromName} <${fromAddress}>`
}

/**
 * Check if we're in test/dry-run mode
 * When true, emails are logged but not sent
 */
function isDryRunMode(): boolean {
  return process.env.EMAIL_DRY_RUN === 'true'
}

export interface EmailRecipient {
  email: string
  name?: string
}

export interface SendEmailParams {
  to: EmailRecipient[]
  subject: string
  html: string
  text?: string
}

export interface SendEmailResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Send an email using Resend
 * Handles dry-run mode, validation, and error handling
 * Never throws - returns result object with success/error
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  try {
    const { to, subject, html, text } = params
    
    // Validate recipients
    if (!to || to.length === 0) {
      return {
        success: false,
        error: 'No recipients provided',
      }
    }
    
    const validRecipients = to.filter(r => r.email && r.email.includes('@'))
    if (validRecipients.length === 0) {
      return {
        success: false,
        error: 'No valid email addresses provided',
      }
    }
    
    // Format recipients for Resend
    const recipientEmails = validRecipients.map(r => 
      r.name ? `${r.name} <${r.email}>` : r.email
    )
    
    // Dry-run mode - log but don't send
    if (isDryRunMode()) {
      console.log('[EMAIL DRY-RUN] Would send email:', {
        from: getFromAddress(),
        to: recipientEmails,
        subject,
        html: html.substring(0, 100) + '...',
      })
      return {
        success: true,
        messageId: `dry-run-${Date.now()}`,
      }
    }
    
    // Send via Resend
    const client = getResendClient()
    const result = await client.emails.send({
      from: getFromAddress(),
      to: recipientEmails,
      subject,
      html,
      text: text || undefined,
    })
    
    if (result.error) {
      console.error('Resend error:', result.error)
      return {
        success: false,
        error: result.error.message || 'Failed to send email',
      }
    }
    
    console.log(`[EMAIL] Sent to ${recipientEmails.length} recipient(s): ${subject}`)
    
    return {
      success: true,
      messageId: result.data?.id,
    }
    
  } catch (error) {
    console.error('Email sending error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error sending email',
    }
  }
}

/**
 * Validate that email environment variables are configured
 * Throws descriptive error if missing required vars
 * Call this at application startup or before first email send
 */
export function validateEmailConfig(): void {
  const requiredVars = ['RESEND_API_KEY', 'EMAIL_FROM_ADDRESS']
  const missing: string[] = []
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missing.push(varName)
    }
  }
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required email environment variables: ${missing.join(', ')}\n` +
      'Please configure these variables before sending emails.'
    )
  }
}

