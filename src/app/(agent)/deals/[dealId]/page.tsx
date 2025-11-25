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
        property_id: null,
        property_address: '123 Main St, San Francisco, CA',
        side: 'buying',
        status: 'in_escrow',
        price: 850000,
        loan_type: 'conventional',
        down_payment_percent: 20,
        close_date: null,
        primary_agent_id: null,
        emd_amount: 50000,
        emd_received_at: '2024-11-20T00:00:00Z',
        inspection_deadline: '2024-11-25T00:00:00Z',
        inspection_contingency_removed_at: null,
        coe_date: '2024-12-15T00:00:00Z',
        created_by: null,
        created_at: '2024-11-15T00:00:00Z',
        updated_at: '2024-11-20T00:00:00Z',
        mls_url: null,
        target_date: null,
        escrow_company_id: null,
        lender_id: null,
        has_hoa: false,
        has_solar: false,
        tc_fee_amount: null,
        tc_fee_payer: null,
        offer_acceptance_date: null,
        emd_due_date: null,
        seller_disclosures_due_date: null,
        buyer_investigation_due_date: null,
        buyer_appraisal_due_date: null,
        buyer_loan_due_date: null,
        buyer_insurance_due_date: null,
        estimated_coe_date: null,
        possession_date: null,
        inspection_scheduled_at: null,
        appraisal_ordered_at: null,
        hoa_docs_received_at: null,
        seller_disclosures_sent_at: null,
        buyer_disclosures_signed_at: null,
        cda_prepared_at: null,
        cda_sent_to_escrow_at: null,
        closed_at: null,
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

