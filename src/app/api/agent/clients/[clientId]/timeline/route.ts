// Client Timeline API
// Returns chronological timeline of events for a client

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentAgentContext } from '@/lib/auth'
import { fetchClientTimeline } from '@/server/db/timeline'
import type { TimelineFilters } from '@/types/clients'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params
    const { profileId, teamId } = await getCurrentAgentContext()

    // Parse query parameters for filters
    const searchParams = request.nextUrl.searchParams
    const eventTypesParam = searchParams.get('eventTypes')

    const filters: TimelineFilters = {}

    if (eventTypesParam) {
      filters.eventTypes = eventTypesParam.split(',') as ('milestone' | 'task' | 'note' | 'document')[]
    }

    const timeline = await fetchClientTimeline(teamId, profileId, clientId, filters)

    return NextResponse.json(timeline)
  } catch (error) {
    console.error('Client Timeline API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: error instanceof Error && error.message.includes('not found') ? 404 : 500 }
    )
  }
}

