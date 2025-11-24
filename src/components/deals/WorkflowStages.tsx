'use client'

interface WorkflowStep {
  id: string
  step_order: number
  name: string
  scheduled_for: string
  executed_at: string | null
  status: string
}

interface WorkflowRun {
  id: string
  workflow_name: string
  status: string
  steps: WorkflowStep[]
}

interface WorkflowStagesProps {
  workflowRuns: WorkflowRun[]
}

export function WorkflowStages({ workflowRuns }: WorkflowStagesProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return '✓'
      case 'error':
        return '✗'
      case 'pending':
        return '○'
      default:
        return '○'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-success border-success/20 bg-success/5'
      case 'error':
        return 'text-danger border-danger/20 bg-danger/5'
      case 'pending':
        return 'text-text-secondary border-border bg-background'
      default:
        return 'text-text-secondary border-border bg-background'
    }
  }

  if (workflowRuns.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-border shadow-soft p-6 mb-6">
        <h2 className="text-lg font-medium text-text-primary mb-4">Workflow Stages</h2>
        <p className="text-text-secondary text-sm">No workflows running</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-border shadow-soft p-6 mb-6">
      <h2 className="text-lg font-medium text-text-primary mb-4">Workflow Stages</h2>
      <div className="space-y-6">
        {workflowRuns.map((run) => (
          <div key={run.id}>
            <h3 className="text-sm font-medium text-text-secondary mb-3">{run.workflow_name}</h3>
            <div className="flex flex-wrap gap-3">
              {run.steps.map((step) => (
                <div
                  key={step.id}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg border text-sm
                    ${getStatusColor(step.status)}
                  `}
                >
                  <span className="text-lg">{getStatusIcon(step.status)}</span>
                  <div>
                    <p className="font-medium">{step.name}</p>
                    <p className="text-xs opacity-75">
                      {step.executed_at
                        ? `Executed ${new Date(step.executed_at).toLocaleDateString()}`
                        : `Scheduled ${new Date(step.scheduled_for).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

