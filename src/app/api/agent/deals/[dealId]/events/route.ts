// Deal Events API
// Handles deal event mutations and triggers workflow engine

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/server/db/supabaseClient'
import { handleDealEvent } from '@/server/workflows/engine'
import { startWorkflowsForDeal } from '@/server/workflows/engine'
import { runImmediateEmailRulesForDeal } from '@/server/transactionEmailRules'
import type { DealEventRequest } from '@/types/workflows'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ dealId: string }> }
) {
  try {
    const { dealId } = await params
    const body: DealEventRequest = await request.json()
    const { eventType, data } = body

    // Validate event type
    const validEventTypes = [
      'set-emd-received',
      'set-inspection-deadline',
      'mark-inspection-contingency-removed',
      'set-coe-date',
      'status-changed',
    ]

    if (!validEventTypes.includes(eventType)) {
      return NextResponse.json(
        { error: `Invalid event type: ${eventType}` },
        { status: 400 }
      )
    }

    // Handle status-changed event specially - start workflows if entering escrow
    if (eventType === 'status-changed' && data?.status === 'in_escrow') {
      await startWorkflowsForDeal(dealId)
      // Run immediate email rules when entering escrow
      await runImmediateEmailRulesForDeal(dealId)
    }

    // Process the event through workflow engine
    await handleDealEvent({
      dealId,
      eventType,
      data,
    })

    // Run immediate email rules after event processing
    // (e.g., inspection scheduled, etc.)
    await runImmediateEmailRulesForDeal(dealId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Deal Events API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

