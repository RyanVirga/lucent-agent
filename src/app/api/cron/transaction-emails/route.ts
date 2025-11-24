// Transaction Emails Cron Job Endpoint
// Called by hosting provider (e.g., Vercel Cron) to run daily email rules

import { NextRequest, NextResponse } from 'next/server'
import { runDailyEmailRules } from '@/server/transactionEmailRules'

/**
 * POST /api/cron/transaction-emails
 * 
 * Runs daily transaction email rules for all active deals
 * 
 * Authentication: Requires CRON_SECRET in header or query param
 * 
 * Returns: JSON summary of emails considered and sent
 */
export async function POST(request: NextRequest) {
  try {
    // Validate cron secret
    const authHeader = request.headers.get('authorization')
    const querySecret = request.nextUrl.searchParams.get('secret')
    const cronSecret = process.env.CRON_SECRET
    
    if (!cronSecret) {
      console.error('[Cron] CRON_SECRET not configured')
      return NextResponse.json(
        { success: false, error: 'CRON_SECRET not configured' },
        { status: 500 }
      )
    }
    
    // Check authorization header (preferred) or query param (fallback)
    const providedSecret = authHeader?.replace('Bearer ', '') || querySecret
    
    if (providedSecret !== cronSecret) {
      console.warn('[Cron] Unauthorized attempt to run cron job')
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    console.log('[Cron] Starting daily transaction email job')
    const startTime = Date.now()
    
    // Run daily email rules
    const stats = await runDailyEmailRules()
    
    const duration = Date.now() - startTime
    console.log(`[Cron] Completed in ${duration}ms:`, stats)
    
    return NextResponse.json({
      success: true,
      ...stats,
      duration_ms: duration,
      timestamp: new Date().toISOString(),
    })
    
  } catch (error) {
    console.error('[Cron] Error running transaction email job:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/cron/transaction-emails
 * 
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ready',
    endpoint: 'transaction-emails',
    method: 'POST',
    auth: 'required',
  })
}

