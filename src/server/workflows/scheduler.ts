// Workflow Scheduler
// Separate module for better testability

import { runDueWorkflowSteps } from './engine'

/**
 * Run workflow scheduler - executes all due workflow steps
 * Called by cron job or manual trigger
 */
export async function runWorkflowScheduler(): Promise<void> {
  const now = new Date()
  console.log(`[Workflow Scheduler] Running at ${now.toISOString()}`)
  
  try {
    await runDueWorkflowSteps(now)
    console.log(`[Workflow Scheduler] Completed successfully`)
  } catch (error) {
    console.error(`[Workflow Scheduler] Error:`, error)
    throw error
  }
}

