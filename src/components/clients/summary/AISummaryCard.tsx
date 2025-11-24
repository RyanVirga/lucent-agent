import { Sparkles } from 'lucide-react'
import type { ClientDetail } from '@/types/clients'
import { getDealSideLabel, getDealStatusLabel } from '@/lib/status-mapping'

interface AISummaryCardProps {
  clientDetail: ClientDetail
}

export function AISummaryCard({ clientDetail }: AISummaryCardProps) {
  const { primaryDeal, property, taskStats } = clientDetail

  if (!primaryDeal) {
    return (
      <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-text-primary">AI Summary</h3>
        </div>
        <p className="text-text-secondary">
          {clientDetail.client.first_name} {clientDetail.client.last_name} does not have an active deal at this time.
        </p>
      </div>
    )
  }

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

  const propertyAddress = property
    ? `${property.street}${property.unit ? ` ${property.unit}` : ''}, ${property.city}, ${property.state}`
    : primaryDeal.deal.property_address

  return (
    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border border-blue-200 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-text-primary">AI Summary</h3>
      </div>
      <p className="text-text-primary leading-relaxed">
        This is a <strong>{getDealSideLabel(primaryDeal.side).toLowerCase()}</strong> deal for{' '}
        <strong>{propertyAddress}</strong> with a closing date of{' '}
        <strong>{formatDate(primaryDeal.deal.close_date)}</strong>. The deal price is{' '}
        <strong>{formatCurrency(primaryDeal.deal.price)}</strong> and is currently in the{' '}
        <strong>{getDealStatusLabel(primaryDeal.deal.status).toLowerCase()}</strong> stage.{' '}
        There {taskStats.total === 1 ? 'is' : 'are'} <strong>{taskStats.total}</strong> open{' '}
        {taskStats.total === 1 ? 'task' : 'tasks'}, with {taskStats.overdue} overdue and{' '}
        {taskStats.dueThisWeek} due this week.
      </p>
    </div>
  )
}

