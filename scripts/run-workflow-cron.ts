// Background job entrypoint for workflow scheduler
// This script can be run via cron or scheduled job service

/**
 * Production Deployment Options:
 * 
 * 1. Vercel Cron: Add to vercel.json
 *    {
 *      "crons": [{
 *        "path": "/api/system/run-workflows",
 *        "schedule": "*/10 * * * *"
 *      }]
 *    }
 * 
 * 2. Supabase Schedule: Use pg_cron extension
 *    SELECT cron.schedule('run-workflows', '*/10 * * * *', 
 *      $$SELECT net.http_post('https://your-app.vercel.app/api/system/run-workflows')$$);
 * 
 * 3. External Cron Service: Use this script directly
 *    node scripts/run-workflow-cron.js
 */

import { runWorkflowScheduler } from '../src/server/workflows/scheduler'

async function main() {
  try {
    await runWorkflowScheduler()
    process.exit(0)
  } catch (error) {
    console.error('Cron job failed:', error)
    process.exit(1)
  }
}

main()

