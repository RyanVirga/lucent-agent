'use client'

import { useState, useEffect, useCallback } from 'react'
import { Calendar, FileText, CheckCircle2, MessageSquare, Filter } from 'lucide-react'
import type { ClientTimelineEvent } from '@/types/clients'
import { Button } from '@/components/ui/Button'

interface ClientTimelineTabProps {
  clientId: string
}

export function ClientTimelineTab({ clientId }: ClientTimelineTabProps) {
  const [events, setEvents] = useState<ClientTimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<('milestone' | 'task' | 'note' | 'document')[]>([])

  const fetchTimeline = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filters.length > 0) {
        params.set('eventTypes', filters.join(','))
      }
      const response = await fetch(`/api/agent/clients/${clientId}/timeline?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch timeline')
      const data = await response.json()
      setEvents(data)
    } catch (error) {
      console.error('Failed to fetch timeline:', error)
    } finally {
      setLoading(false)
    }
  }, [clientId, filters])

  useEffect(() => {
    fetchTimeline()
  }, [fetchTimeline])

  const toggleFilter = (type: 'milestone' | 'task' | 'note' | 'document') => {
    setFilters(prev =>
      prev.includes(type) ? prev.filter(f => f !== type) : [...prev, type]
    )
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'milestone':
        return <Calendar className="w-5 h-5 text-blue-500" />
      case 'task':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case 'note':
        return <MessageSquare className="w-5 h-5 text-purple-500" />
      case 'document':
        return <FileText className="w-5 h-5 text-orange-500" />
      default:
        return <Calendar className="w-5 h-5 text-gray-500" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const getEventDescription = (event: ClientTimelineEvent) => {
    switch (event.type) {
      case 'milestone':
        return `${event.data.type.replace('_', ' ')} milestone${event.data.completed_at ? ' completed' : ' due'}`
      case 'task':
        return event.data.title
      case 'note':
        return event.data.body.substring(0, 100) + (event.data.body.length > 100 ? '...' : '')
      case 'document':
        return event.data.name
    }
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

  // Group events by date
  const groupedEvents = events.reduce((acc, event) => {
    const date = new Date(event.created_at).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
    if (!acc[date]) acc[date] = []
    acc[date].push(event)
    return acc
  }, {} as Record<string, ClientTimelineEvent[]>)

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-5 h-5 text-text-secondary" />
          <span className="text-sm font-semibold text-text-secondary">Filter by type:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['milestone', 'task', 'note', 'document'] as const).map((type) => (
            <Button
              key={type}
              onClick={() => toggleFilter(type)}
              variant={filters.includes(type) ? 'primary' : 'ghost'}
              size="sm"
              className={!filters.includes(type) ? 'bg-gray-100' : ''}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      {Object.keys(groupedEvents).length === 0 ? (
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-12 text-center">
          <p className="text-text-secondary">No timeline events found</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedEvents).map(([date, dateEvents]) => (
            <div key={date}>
              <h3 className="text-lg font-semibold text-text-primary mb-4">{date}</h3>
              <div className="space-y-4">
                {dateEvents.map((event, index) => (
                  <div
                    key={`${event.type}-${index}`}
                    className="flex items-start gap-4 p-4 bg-white rounded-xl border border-border/50 hover:shadow-md transition-all"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {getEventIcon(event.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-text-primary mb-1">
                        {getEventDescription(event)}
                      </div>
                      <div className="text-sm text-text-secondary">
                        {formatDate(event.created_at)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
