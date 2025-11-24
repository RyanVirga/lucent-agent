// Environment Variable Validation
// Validates required environment variables at startup

/**
 * Validate that all required environment variables are set
 * Throws descriptive error if any are missing
 * 
 * Call this at application startup or before using dependent features
 */
export function validateEnv(): void {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ]
  
  const missing: string[] = []
  
  for (const varName of required) {
    if (!process.env[varName]) {
      missing.push(varName)
    }
  }
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please configure these variables before starting the application.'
    )
  }
}

/**
 * Validate email-specific environment variables
 * Called before sending emails
 */
export function validateEmailEnv(): void {
  const required = ['RESEND_API_KEY', 'EMAIL_FROM_ADDRESS']
  const missing: string[] = []
  
  for (const varName of required) {
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

/**
 * Validate cron-specific environment variables
 * Called by cron endpoints
 */
export function validateCronEnv(): void {
  if (!process.env.CRON_SECRET) {
    throw new Error(
      'Missing CRON_SECRET environment variable.\n' +
      'Please configure this variable to secure cron endpoints.'
    )
  }
}

/**
 * Get environment info for debugging
 * Safe to log (doesn't expose secrets)
 */
export function getEnvInfo(): {
  nodeEnv: string
  hasSupabase: boolean
  hasEmail: boolean
  hasCron: boolean
  emailDryRun: boolean
} {
  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    hasSupabase: !!(
      process.env.NEXT_PUBLIC_SUPABASE_URL && 
      process.env.SUPABASE_SERVICE_ROLE_KEY
    ),
    hasEmail: !!(
      process.env.RESEND_API_KEY && 
      process.env.EMAIL_FROM_ADDRESS
    ),
    hasCron: !!process.env.CRON_SECRET,
    emailDryRun: process.env.EMAIL_DRY_RUN === 'true',
  }
}

