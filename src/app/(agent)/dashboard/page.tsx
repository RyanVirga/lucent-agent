'use client'

import { useEffect, useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { ActiveDealsCard } from '@/components/dashboard/ActiveDealsCard'
import { NextActionsCard } from '@/components/dashboard/NextActionsCard'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { BarChart3, CheckCircle2, AlertTriangle, Target, Plus } from 'lucide-react'
import { ButtonLink } from '@/components/ui/ButtonLink'
import type { DashboardResponse } from '@/types/workflows'

export default function DashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // TODO: Replace with actual API call
    // const fetchData = async () => {
    //   const res = await fetch('/api/agent/dashboard')
    //   const data = await res.json()
    //   setData(data)
    //   setLoading(false)
    // }
    // fetchData()

    // Mock data for now
    setData({
      activeDeals: [
        {
          id: '1',
          property_address: '123 Main St, San Francisco, CA',
          side: 'buying',
          status: 'in_escrow',
          coe_date: '2024-12-15T00:00:00Z',
          health: 'healthy',
        },
        {
          id: '2',
          property_address: '456 Oak Ave, Oakland, CA',
          side: 'listing',
          status: 'pending_contingencies',
          coe_date: '2024-12-10T00:00:00Z',
          health: 'warning',
        },
      ],
      upcomingTasks: [
        {
          id: '1',
          deal_id: '1',
          title: 'Verify EMD Receipt',
          due_date: '2024-11-25T00:00:00Z',
          property_address: '123 Main St, San Francisco, CA',
        },
        {
          id: '2',
          deal_id: '2',
          title: 'Complete Seller Disclosures',
          due_date: '2024-11-26T00:00:00Z',
          property_address: '456 Oak Ave, Oakland, CA',
        },
      ],
      overdueTasks: [],
    })
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        </div>
      </AppShell>
    )
  }

  const stats = [
    {
      label: 'Active Deals',
      value: data?.activeDeals.length || 0,
      icon: BarChart3,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Upcoming Tasks',
      value: data?.upcomingTasks.length || 0,
      icon: CheckCircle2,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      label: 'Overdue Tasks',
      value: data?.overdueTasks.length || 0,
      icon: AlertTriangle,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    {
      label: 'Completion Rate',
      value: '94%',
      icon: Target,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
  ]

  return (
    <AppShell firstName="Sarah">
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
            <p className="text-sm text-text-secondary mt-1">Overview of your active deals and tasks</p>
          </div>
          <ButtonLink 
            href="/deals/new" 
            leftIcon={<Plus className="w-4 h-4" />}
          >
            New Deal
          </ButtonLink>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-xl border border-border shadow-sm p-6 flex items-center justify-between hover:shadow-md transition-shadow duration-200"
            >
              <div>
                <p className="text-sm font-medium text-text-secondary">{stat.label}</p>
                <p className="text-3xl font-bold text-text-primary mt-2">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column (Deals & Feed) - Takes up 2/3 on large screens */}
          <div className="xl:col-span-2 space-y-8">
            <ActiveDealsCard deals={data?.activeDeals || []} />
            <ActivityFeed events={[]} />
          </div>
          
          {/* Right Column (Tasks) - Takes up 1/3 on large screens */}
          <div className="xl:col-span-1 h-full">
            <NextActionsCard
              upcomingTasks={data?.upcomingTasks || []}
              overdueTasks={data?.overdueTasks || []}
            />
          </div>
        </div>
      </div>
    </AppShell>
  )
}
