// Clients List API
// Returns list of clients for the current agent with optional filters

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentAgentContext } from '@/lib/auth'
import { fetchAgentClientsWithDeals } from '@/server/db/clients'
import type { ClientFilters, DealStatus, DealSide } from '@/types/clients'

export async function GET(request: NextRequest) {
  try {
    const { profileId, teamId } = await getCurrentAgentContext()

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || undefined
    const statusParam = searchParams.get('status')
    const sideParam = searchParams.get('side')
    const closingThisWeek = searchParams.get('closingThisWeek') === 'true'
    const closingThisMonth = searchParams.get('closingThisMonth') === 'true'

    const filters: ClientFilters = {}

    if (search) {
      filters.search = search
    }

    if (statusParam) {
      filters.status = statusParam.split(',') as DealStatus[]
    }

    if (sideParam) {
      filters.side = sideParam.split(',') as DealSide[]
    }

    if (closingThisWeek) {
      filters.closingThisWeek = true
    }

    if (closingThisMonth) {
      filters.closingThisMonth = true
    }

    const clients = await fetchAgentClientsWithDeals(teamId, profileId, filters)

    return NextResponse.json(clients)
  } catch (error) {
    console.error('Clients API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: error instanceof Error && error.message.includes('authenticated') ? 401 : 500 }
    )
  }
}

