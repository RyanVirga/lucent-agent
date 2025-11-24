'use client'

import { useRouter } from 'next/navigation'
import { AlertTriangle, Calendar, CheckCircle2 } from 'lucide-react'
import type { ClientWithDeals } from '@/types/clients'
import { getDealSideLabel, getSideColor, getStatusColor, getDealStatusLabel } from '@/lib/status-mapping'

interface ClientsTableProps {
  clients: ClientWithDeals[]
  loading?: boolean
}

export function ClientsTable({ clients, loading }: ClientsTableProps) {
  const router = useRouter()

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getNextImportantDate = (client: ClientWithDeals) => {
    const nextMilestone = client.deals
      .map(d => d.nextMilestone)
      .filter(Boolean)
      .sort((a, b) => 
        new Date(a!.due_date).getTime() - new Date(b!.due_date).getTime()
      )[0]

    return nextMilestone?.due_date || null
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-12">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        </div>
      </div>
    )
  }

  if (clients.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-12">
        <div className="text-center">
          <p className="text-text-secondary font-medium">No clients found</p>
          <p className="text-text-muted text-sm mt-1">Try adjusting your filters</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-blue-50/50 to-cyan-50/50 border-b border-border/50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Client
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Property
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Next Date
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Tasks
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Risk
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Last Activity
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {clients.map((clientWithDeals) => {
              const client = clientWithDeals.client
              const primaryDeal = clientWithDeals.deals[0] || null
              const property = primaryDeal?.property
              const nextDate = getNextImportantDate(clientWithDeals)
              const hasAlerts = clientWithDeals.alertCount > 0

              return (
                <tr
                  key={client.id}
                  onClick={() => router.push(`/clients/${client.id}`)}
                  className="hover:bg-gray-50/50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold text-sm">
                        {getInitials(client.first_name, client.last_name)}
                      </div>
                      <div>
                        <div className="font-semibold text-text-primary">
                          {client.first_name} {client.last_name}
                        </div>
                        {primaryDeal && (
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium mt-1 ${getSideColor(primaryDeal.side)}`}>
                            {getDealSideLabel(primaryDeal.side)}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-text-primary font-medium">
                      {property
                        ? `${property.street}${property.unit ? ` ${property.unit}` : ''}, ${property.city}, ${property.state}`
                        : primaryDeal?.deal.property_address || 'N/A'}
                    </div>
                    {property?.type && (
                      <div className="text-xs text-text-secondary mt-1 capitalize">
                        {property.type.replace('_', ' ')}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {primaryDeal ? (
                      <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold ${getStatusColor(primaryDeal.status)}`}>
                        {getDealStatusLabel(primaryDeal.status)}
                      </span>
                    ) : (
                      <span className="text-text-muted text-sm">No active deal</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {nextDate ? (
                      <div className="flex items-center gap-2 text-sm text-text-primary">
                        <Calendar className="w-4 h-4 text-text-secondary" />
                        {formatDate(nextDate)}
                      </div>
                    ) : (
                      <span className="text-text-muted text-sm">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      {clientWithDeals.taskCounts.overdue > 0 && (
                        <span className="text-red-600 font-semibold">
                          {clientWithDeals.taskCounts.overdue} overdue
                        </span>
                      )}
                      {clientWithDeals.taskCounts.overdue > 0 && clientWithDeals.taskCounts.upcoming > 0 && (
                        <span className="mx-1 text-text-muted">•</span>
                      )}
                      {clientWithDeals.taskCounts.upcoming > 0 && (
                        <span className="text-text-secondary">
                          {clientWithDeals.taskCounts.upcoming} upcoming
                        </span>
                      )}
                      {clientWithDeals.taskCounts.overdue === 0 && clientWithDeals.taskCounts.upcoming === 0 && (
                        <span className="text-text-muted">No tasks</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {hasAlerts ? (
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        <span className="text-sm font-medium text-red-600">
                          {clientWithDeals.alertCount} alert{clientWithDeals.alertCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                    {clientWithDeals.lastActivity ? formatDate(clientWithDeals.lastActivity) : 'N/A'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

