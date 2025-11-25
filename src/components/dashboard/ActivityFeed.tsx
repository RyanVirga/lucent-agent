'use client'

import { Mail, CheckCircle2, Settings, Play, FileText, ClipboardList, Inbox } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface TimelineEvent {
  id: string
  event_type: string
  description: string
  created_at: string
}

interface ActivityFeedProps {
  events: TimelineEvent[]
}

export function ActivityFeed({ events }: ActivityFeedProps) {
  const getEventIcon = (eventType: string) => {
    if (eventType.includes('email')) return Mail
    if (eventType.includes('task')) return CheckCircle2
    if (eventType.includes('workflow')) return Settings
    if (eventType.includes('step')) return Play
    return FileText
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="bg-white rounded-xl border border-border shadow-sm flex flex-col">
      <div className="p-6 border-b border-border flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-text-secondary" />
          Activity Feed
        </h3>
      </div>
      
      <div className="p-6">
        {events.length === 0 ? (
          <div className="text-center py-8">
            <Inbox className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="text-text-secondary text-sm font-medium">No recent activity</p>
          </div>
        ) : (
          <div className="relative border-l border-border ml-3 space-y-6">
            {events.slice(0, 10).map((event) => {
              const Icon = getEventIcon(event.event_type)
              
              return (
                <div key={event.id} className="relative pl-6 group">
                  {/* Dot */}
                  <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full border-2 border-white bg-gray-300 group-hover:bg-accent transition-colors shadow-sm"></div>
                  
                  <div className="flex flex-col gap-1">
                    <p className="text-sm text-text-primary">
                      {event.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                      <Icon className="w-3 h-3" />
                      <span className="capitalize">{event.event_type.replace('_', ' ')}</span>
                      <span>•</span>
                      <span>{formatTimeAgo(event.created_at)}</span>
                    </div>
                  </div>
                </div>
              )
            })}
            
            {events.length > 10 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="pl-6 text-accent hover:text-accent-dark pt-2 justify-start h-auto p-0 hover:bg-transparent"
              >
                View all activity →
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
