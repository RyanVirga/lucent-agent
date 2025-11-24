'use client'

interface Deal {
  inspection_deadline: string | null
  coe_date: string | null
  emd_received_at: string | null
  inspection_contingency_removed_at: string | null
}

interface DeadlinesCardProps {
  deal: Deal
}

export function DeadlinesCard({ deal }: DeadlinesCardProps) {
  const deadlines = [
    {
      label: 'Inspection Deadline',
      date: deal.inspection_deadline,
      status: deal.inspection_contingency_removed_at ? 'completed' : 'pending',
    },
    {
      label: 'Close of Escrow',
      date: deal.coe_date,
      status: 'pending',
    },
    {
      label: 'EMD Received',
      date: deal.emd_received_at,
      status: deal.emd_received_at ? 'completed' : 'pending',
    },
  ].filter((d) => d.date)

  return (
    <div className="bg-white rounded-xl border border-border shadow-soft p-6 mb-6">
      <h2 className="text-lg font-medium text-text-primary mb-4">Deadlines & Contingencies</h2>
      {deadlines.length === 0 ? (
        <p className="text-text-secondary text-sm">No deadlines set</p>
      ) : (
        <div className="space-y-3">
          {deadlines.map((deadline, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-lg border border-border"
            >
              <span className="text-sm text-text-primary">{deadline.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-text-secondary">
                  {deadline.date ? new Date(deadline.date).toLocaleDateString() : 'Not set'}
                </span>
                {deadline.status === 'completed' && (
                  <span className="text-success text-sm">✓</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

