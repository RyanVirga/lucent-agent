'use client'

import type { Deal } from '@/types/database'

interface DealHeaderProps {
  deal: Deal
}

export function DealHeader({ deal }: DealHeaderProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'closed':
        return 'bg-success/10 text-success border-success/20'
      case 'cancelled':
        return 'bg-text-secondary/10 text-text-secondary border-text-secondary/20'
      case 'in_escrow':
        return 'bg-accent/10 text-accent border-accent/20'
      default:
        return 'bg-warning/10 text-warning border-warning/20'
    }
  }

  const getSideColor = (side: string) => {
    // Using accent color for both sides - can be customized via Tailwind config
    return side === 'buying'
      ? 'bg-accent/10 text-accent border-accent/20'
      : 'bg-accent-light/10 text-accent-light border-accent-light/20'
  }

  return (
    <div className="bg-white rounded-xl border border-border shadow-soft p-6 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-text-primary mb-3">
            {deal.property_address}
          </h1>
          <div className="flex items-center gap-3 flex-wrap">
            <span
              className={`px-3 py-1 text-sm font-medium rounded-md border capitalize ${getSideColor(
                deal.side
              )}`}
            >
              {deal.side}
            </span>
            <span
              className={`px-3 py-1 text-sm font-medium rounded-md border capitalize ${getStatusColor(
                deal.status
              )}`}
            >
              {deal.status.replace('_', ' ')}
            </span>
            {deal.coe_date && (
              <span className="text-sm text-text-secondary">
                COE: {new Date(deal.coe_date).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

