// Task Update API
// PATCH: Updates task completion status

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentAgentContext } from '@/lib/auth'
import { updateTaskStatus } from '@/server/db/tasks'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params
    const { profileId, teamId } = await getCurrentAgentContext()

    const body: { completed: boolean } = await request.json()

    await updateTaskStatus(teamId, profileId, taskId, body.completed)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update Task API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: error instanceof Error && error.message.includes('not found') ? 404 : 500 }
    )
  }
}

