// Client Documents API
// Returns all documents for a client's deals

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentAgentContext } from '@/lib/auth'
import { fetchClientDocuments } from '@/server/db/documents'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params
    const { profileId, teamId } = await getCurrentAgentContext()

    const documents = await fetchClientDocuments(teamId, profileId, clientId)

    return NextResponse.json(documents)
  } catch (error) {
    console.error('Client Documents API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: error instanceof Error && error.message.includes('not found') ? 404 : 500 }
    )
  }
}

