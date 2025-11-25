'use client'

import { Home, FileText, BarChart3, Inbox, ChevronRight, Building2 } from 'lucide-react'
import type { DealSide, DealStatus } from '@/types/database'

interface Deal {
  id: string
  property_address: string
  side: DealSide
  status: DealStatus
  coe_date: string | null
  health: 'healthy' | 'warning' | 'critical'
}

interface ActiveDealsCardProps {
  deals: Deal[]
}

export function ActiveDealsCard({ deals }: ActiveDealsCardProps) {
  const getHealthColor = (health: string) => {
    switch (health) {
      case 'critical':
        return 'bg-red-500'
      case 'warning':
        return 'bg-amber-500'
      default:
        return 'bg-emerald-500'
    }
  }

  const getStatusColor = (status: string) => {
    if (status.includes('escrow')) return 'text-blue-700 bg-blue-50 border-blue-200'
    if (status.includes('pending')) return 'text-purple-700 bg-purple-50 border-purple-200'
    return 'text-gray-700 bg-gray-50 border-gray-200'
  }

  const getSideIcon = (side: DealSide) => {
    switch (side) {
      case 'buying':
        return Home
      case 'listing':
        return FileText
      case 'landlord':
      case 'tenant':
      case 'dual':
        return Building2
    }
  }

  return (
    <div className="bg-white rounded-xl border border-border shadow-sm flex flex-col h-full">
      <div className="p-6 border-b border-border flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-text-secondary" />
          Active Deals
        </h3>
        <span className="text-xs font-medium text-text-secondary bg-gray-100 px-2.5 py-1 rounded-full">
          {deals.length}
        </span>
      </div>
      
      <div className="p-4 flex-1">
        {deals.length === 0 ? (
          <div className="text-center py-12">
            <Inbox className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="text-text-secondary text-sm font-medium">No active deals</p>
          </div>
        ) : (
          <div className="space-y-3">
            {deals.map((deal) => {
              const IconComponent = getSideIcon(deal.side)
              const healthColor = getHealthColor(deal.health)
              
              return (
                <div
                  key={deal.id}
                  className="group flex items-center justify-between p-4 rounded-lg border border-border hover:border-accent/50 hover:shadow-sm transition-all duration-200 cursor-pointer bg-white"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-gray-50 text-gray-500 group-hover:text-accent transition-colors">
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-medium text-text-primary text-sm leading-tight mb-1">
                        {deal.property_address}
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${healthColor}`}></span>
                        <span className="text-xs text-text-secondary capitalize">
                          {deal.side}
                        </span>
                        <span className="text-text-secondary text-xs">•</span>
                        <span className="text-xs text-text-secondary">
                          COE: {deal.coe_date ? new Date(deal.coe_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-md border ${getStatusColor(deal.status)} capitalize hidden sm:inline-block`}>
                      {deal.status.replace('_', ' ')}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-accent transition-colors" />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
