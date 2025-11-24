'use client'

import { useState } from 'react'
import type { ClientDetail } from '@/types/clients'
import { ClientSummaryTab } from './ClientSummaryTab'
import { ClientTimelineTab } from './timeline/ClientTimelineTab'
import { ClientDocumentsTab } from './documents/ClientDocumentsTab'
import { ClientTasksTab } from './tasks/ClientTasksTab'

interface ClientTabsProps {
  clientDetail: ClientDetail
}

const tabs = [
  { id: 'summary', label: 'Summary' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'documents', label: 'Documents' },
  { id: 'tasks', label: 'Tasks' },
] as const

type TabId = typeof tabs[number]['id']

export function ClientTabs({ clientDetail }: ClientTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('summary')

  return (
    <div>
      {/* Tab Navigation */}
      <div className="border-b border-border/50 mb-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'summary' && <ClientSummaryTab clientDetail={clientDetail} />}
        {activeTab === 'timeline' && <ClientTimelineTab clientId={clientDetail.client.id} />}
        {activeTab === 'documents' && <ClientDocumentsTab clientId={clientDetail.client.id} />}
        {activeTab === 'tasks' && <ClientTasksTab clientId={clientDetail.client.id} />}
      </div>
    </div>
  )
}

