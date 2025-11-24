import { Home } from 'lucide-react'
import type { DealSummary } from '@/types/clients'
import { getDealSideLabel, getSideColor, getDealStatusLabel, getStatusColor } from '@/lib/status-mapping'

interface DealOverviewCardProps {
  dealSummary: DealSummary | null
}

export function DealOverviewCard({ dealSummary }: DealOverviewCardProps) {
  if (!dealSummary) {
    return (
      <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-6">
        <p className="text-text-secondary">No active deal</p>
      </div>
    )
  }

  const { deal, property, nextMilestone } = dealSummary

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-6">
      <h3 className="text-lg font-semibold text-text-primary mb-4">Deal Overview</h3>
      
      <div className="space-y-4">
        {/* Property Thumbnail Placeholder */}
        <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center">
          <Home className="w-16 h-16 text-blue-400" />
        </div>

        {/* Property Address */}
        <div>
          <div className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-1">
            Property Address
          </div>
          <div className="text-base font-medium text-text-primary">
            {property
              ? `${property.street}${property.unit ? ` ${property.unit}` : ''}, ${property.city}, ${property.state} ${property.postal_code}`
              : deal.property_address}
          </div>
        </div>

        {/* Deal Info Grid */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
          <div>
            <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
              Side
            </div>
            <span className={`inline-block px-2.5 py-1 rounded-lg text-sm font-semibold ${getSideColor(deal.side)}`}>
              {getDealSideLabel(deal.side)}
            </span>
          </div>
          <div>
            <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
              Status
            </div>
            <span className={`inline-block px-2.5 py-1 rounded-lg text-sm font-semibold ${getStatusColor(deal.status)}`}>
              {getDealStatusLabel(deal.status)}
            </span>
          </div>
          <div>
            <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
              Price
            </div>
            <div className="text-base font-semibold text-text-primary">
              {formatCurrency(deal.price)}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
              Loan Type
            </div>
            <div className="text-base font-medium text-text-primary">
              {deal.loan_type || 'N/A'}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
              Down Payment
            </div>
            <div className="text-base font-medium text-text-primary">
              {deal.down_payment_percent ? `${deal.down_payment_percent}%` : 'N/A'}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
              Close Date
            </div>
            <div className="text-base font-medium text-text-primary">
              {formatDate(deal.close_date)}
            </div>
          </div>
        </div>

        {/* Next Critical Milestone */}
        {nextMilestone && (
          <div className="pt-4 border-t border-border/50">
            <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
              Next Critical Milestone
            </div>
            <div className="text-base font-medium text-text-primary">
              {nextMilestone.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} - {formatDate(nextMilestone.due_date)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

