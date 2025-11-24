// Client Detail API
// Returns full client detail with deals, tasks, alerts, etc.

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentAgentContext } from '@/lib/auth'
import { fetchClientDetail } from '@/server/db/clients'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params
    const { profileId, teamId } = await getCurrentAgentContext()

    const clientDetail = await fetchClientDetail(teamId, profileId, clientId)

    return NextResponse.json(clientDetail)
  } catch (error) {
    console.error('Client Detail API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: error instanceof Error && error.message.includes('not found') ? 404 : 500 }
    )
  }
}

