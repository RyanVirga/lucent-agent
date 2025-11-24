// Deal Status Update API
// PATCH: Updates deal status

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentAgentContext } from '@/lib/auth'
import { updateDealStatus } from '@/server/db/clients'
import type { DealStatus } from '@/types/database'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string }> }
) {
  try {
    const { dealId } = await params
    const { profileId, teamId } = await getCurrentAgentContext()

    const body: { status: DealStatus } = await request.json()

    await updateDealStatus(teamId, profileId, dealId, body.status)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update Deal Status API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: error instanceof Error && error.message.includes('not found') ? 404 : 500 }
    )
  }
}

