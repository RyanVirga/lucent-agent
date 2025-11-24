// Client Tasks API
// GET: Returns tasks grouped by status
// POST: Creates a new task

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentAgentContext } from '@/lib/auth'
import { fetchClientTasks, createClientTask } from '@/server/db/tasks'
import type { CreateTaskInput } from '@/types/clients'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params
    const { profileId, teamId } = await getCurrentAgentContext()

    const tasks = await fetchClientTasks(teamId, profileId, clientId)

    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Client Tasks API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: error instanceof Error && error.message.includes('not found') ? 404 : 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params
    const { profileId, teamId } = await getCurrentAgentContext()

    const body: Omit<CreateTaskInput, 'client_id'> = await request.json()
    
    const taskInput: CreateTaskInput = {
      ...body,
      client_id: clientId,
    }

    const task = await createClientTask(teamId, profileId, taskInput)

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Create Task API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: error instanceof Error && error.message.includes('not found') ? 404 : 500 }
    )
  }
}

