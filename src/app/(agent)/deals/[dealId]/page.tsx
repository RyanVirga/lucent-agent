'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { DealHeader } from '@/components/deals/DealHeader'
import { WorkflowStages } from '@/components/deals/WorkflowStages'
import { DeadlinesCard } from '@/components/deals/DeadlinesCard'
import { AgentTasksList } from '@/components/deals/AgentTasksList'
import { DealTimeline } from '@/components/deals/DealTimeline'
import type { DealTCResponse } from '@/types/workflows'

export default function DealDetailPage() {
  const params = useParams()
  const dealId = params.dealId as string
  const [data, setData] = useState<DealTCResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // TODO: Replace with actual API call
    // const fetchData = async () => {
    //   const res = await fetch(`/api/agent/deals/${dealId}/tc`)
    //   const data = await res.json()
    //   setData(data)
    //   setLoading(false)
    // }
    // fetchData()

    // Mock data for now
    setData({
      deal: {
        id: dealId,
        team_id: '1',
        property_address: '123 Main St, San Francisco, CA',
        side: 'buying',
        status: 'in_escrow',
        emd_amount: 50000,
        emd_received_at: '2024-11-20T00:00:00Z',
        inspection_deadline: '2024-11-25T00:00:00Z',
        inspection_contingency_removed_at: null,
        coe_date: '2024-12-15T00:00:00Z',
        created_by: null,
        created_at: '2024-11-15T00:00:00Z',
        updated_at: '2024-11-20T00:00:00Z',
      },
      workflowRuns: [
        {
          id: '1',
          workflow_definition_id: '1',
          workflow_name: 'Buying Side TC Workflow',
          status: 'active',
          steps: [
            {
              id: '1',
              step_order: 1,
              name: 'Send Buyer Welcome Email',
              scheduled_for: '2024-11-15T00:00:00Z',
              executed_at: '2024-11-15T00:00:00Z',
              status: 'completed',
            },
            {
              id: '2',
              step_order: 2,
              name: 'Notify Lender',
              scheduled_for: '2024-11-15T00:00:00Z',
              executed_at: '2024-11-15T00:00:00Z',
              status: 'completed',
            },
            {
              id: '3',
              step_order: 4,
              name: 'EMD Verification Task',
              scheduled_for: '2024-11-16T00:00:00Z',
              executed_at: null,
              status: 'pending',
            },
            {
              id: '4',
              step_order: 6,
              name: 'Inspection Deadline Reminder',
              scheduled_for: '2024-11-22T00:00:00Z',
              executed_at: null,
              status: 'pending',
            },
          ],
        },
      ],
      tasks: [
        {
          id: '1',
          title: 'Verify EMD Receipt',
          description: 'Confirm that earnest money deposit has been received by escrow',
          due_date: '2024-11-18T00:00:00Z',
          completed_at: null,
        },
      ],
      timeline: [
        {
          id: '1',
          event_type: 'workflow_started',
          description: 'Started Buying Side TC Workflow',
          created_at: '2024-11-15T00:00:00Z',
        },
        {
          id: '2',
          event_type: 'step_executed',
          description: 'Executed: Send Buyer Welcome Email',
          created_at: '2024-11-15T00:00:00Z',
        },
        {
          id: '3',
          event_type: 'deal_event',
          description: 'EMD received',
          created_at: '2024-11-20T00:00:00Z',
        },
      ],
    })
    setLoading(false)
  }, [dealId])

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <p className="text-text-secondary">Loading...</p>
        </div>
      </AppShell>
    )
  }

  if (!data) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <p className="text-text-secondary">Deal not found</p>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <DealHeader deal={data.deal} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <WorkflowStages workflowRuns={data.workflowRuns} />
          <DeadlinesCard deal={data.deal} />
        </div>
        <div>
          <AgentTasksList tasks={data.tasks} />
          <DealTimeline events={data.timeline} />
        </div>
      </div>
    </AppShell>
  )
}

