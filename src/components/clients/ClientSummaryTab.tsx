import type { ClientDetail } from '@/types/clients'
import { DealOverviewCard } from './summary/DealOverviewCard'
import { StageStepper } from './summary/StageStepper'
import { AISummaryCard } from './summary/AISummaryCard'
import { RiskAlertsCard } from './summary/RiskAlertsCard'

interface ClientSummaryTabProps {
  clientDetail: ClientDetail
}

export function ClientSummaryTab({ clientDetail }: ClientSummaryTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DealOverviewCard dealSummary={clientDetail.primaryDeal} />
        <AISummaryCard clientDetail={clientDetail} />
      </div>

      <StageStepper 
        dealSummary={clientDetail.primaryDeal} 
        milestones={clientDetail.milestones}
      />

      <RiskAlertsCard alerts={clientDetail.alerts} />
    </div>
  )
}

