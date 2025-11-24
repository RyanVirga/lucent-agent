// Workflow Scheduler Manual Trigger
// For development/testing - production should use cron

import { NextResponse } from 'next/server'
import { runWorkflowScheduler } from '@/server/workflows/scheduler'

export async function POST() {
  try {
    // Check feature flag
    const enableCron = process.env.ENABLE_WORKFLOW_CRON === 'true'

    if (!enableCron) {
      return NextResponse.json(
        { 
          error: 'Workflow cron is disabled. Set ENABLE_WORKFLOW_CRON=true to enable.',
          note: 'This endpoint is for development/testing. In production, use a cron service (Vercel cron, Supabase Schedule, or external service) to call runWorkflowScheduler() every 5-15 minutes.'
        },
        { status: 403 }
      )
    }

    await runWorkflowScheduler()

    return NextResponse.json({ 
      success: true,
      message: 'Workflow scheduler executed successfully'
    })
  } catch (error) {
    console.error('Workflow scheduler error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

