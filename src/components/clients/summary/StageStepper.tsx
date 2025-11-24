import { CheckCircle2, Circle } from 'lucide-react'
import type { DealMilestone } from '@/types/database'
import type { DealSummary } from '@/types/clients'

interface StageStepperProps {
  dealSummary: DealSummary | null
  milestones: DealMilestone[]
}

const stages = [
  { id: 'offer', label: 'Offer' },
  { id: 'under_contract', label: 'Under Contract' },
  { id: 'inspections', label: 'Inspections' },
  { id: 'appraisal', label: 'Appraisal' },
  { id: 'loan', label: 'Loan' },
  { id: 'docs_to_title', label: 'Docs to Title' },
  { id: 'closing', label: 'Closing' },
] as const

export function StageStepper({ dealSummary, milestones }: StageStepperProps) {
  if (!dealSummary) {
    return null
  }

  const getStageStatus = (stageId: string) => {
    const deal = dealSummary.deal

    // Map deal status to stages
    if (stageId === 'offer' && ['lead', 'searching'].includes(deal.status)) {
      return 'active'
    }
    if (stageId === 'under_contract' && deal.status === 'under_contract') {
      return 'active'
    }
    if (stageId === 'inspections' && ['in_escrow', 'pending_contingencies'].includes(deal.status)) {
      // Check if inspection milestone exists
      const inspectionMilestone = milestones.find(m => m.type === 'inspection')
      if (inspectionMilestone) {
        return inspectionMilestone.completed_at ? 'completed' : 'active'
      }
      return 'upcoming'
    }
    if (stageId === 'appraisal' && ['in_escrow', 'pending_contingencies'].includes(deal.status)) {
      const appraisalMilestone = milestones.find(m => m.type === 'appraisal')
      if (appraisalMilestone) {
        return appraisalMilestone.completed_at ? 'completed' : 'active'
      }
      return 'upcoming'
    }
    if (stageId === 'loan' && ['in_escrow', 'pending_contingencies'].includes(deal.status)) {
      const loanMilestone = milestones.find(m => m.type === 'loan_contingency')
      if (loanMilestone) {
        return loanMilestone.completed_at ? 'completed' : 'active'
      }
      return 'upcoming'
    }
    if (stageId === 'docs_to_title' && ['pending_coe', 'pending'].includes(deal.status)) {
      return 'active'
    }
    if (stageId === 'closing' && deal.status === 'closed') {
      return 'completed'
    }
    if (stageId === 'closing' && ['pending_coe', 'pending'].includes(deal.status)) {
      return 'active'
    }

    return 'upcoming'
  }

  return (
    <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-6">
      <h3 className="text-lg font-semibold text-text-primary mb-6">Pipeline Stages</h3>
      
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300"
            style={{ 
              width: `${(stages.filter((_, i) => {
                const status = getStageStatus(stages[i].id)
                return status === 'completed' || status === 'active'
              }).length / stages.length) * 100}%` 
            }}
          />
        </div>

        {/* Stages */}
        <div className="relative flex justify-between">
          {stages.map((stage, index) => {
            const status = getStageStatus(stage.id)
            const isCompleted = status === 'completed'
            const isActive = status === 'active'

            return (
              <div key={stage.id} className="flex flex-col items-center flex-1">
                <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                  isCompleted
                    ? 'bg-green-500 border-green-500 text-white'
                    : isActive
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'bg-white border-gray-300 text-gray-400'
                }`}>
                  {isCompleted ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <Circle className="w-6 h-6" />
                  )}
                </div>
                <div className={`mt-2 text-xs font-medium text-center ${
                  isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                }`}>
                  {stage.label}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

