'use client'

interface TimelineEvent {
  id: string
  event_type: string
  description: string
  created_at: string
}

interface DealTimelineProps {
  events: TimelineEvent[]
}

export function DealTimeline({ events }: DealTimelineProps) {
  const getEventIcon = (eventType: string) => {
    if (eventType.includes('email')) return '✉️'
    if (eventType.includes('task')) return '✓'
    if (eventType.includes('workflow')) return '⚙️'
    if (eventType.includes('step')) return '▶️'
    if (eventType.includes('field')) return '📝'
    return '📌'
  }

  return (
    <div className="bg-white rounded-xl border border-border shadow-soft p-6">
      <h2 className="text-lg font-medium text-text-primary mb-4">Timeline</h2>
      {events.length === 0 ? (
        <p className="text-text-secondary text-sm">No timeline events</p>
      ) : (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
          <div className="space-y-4">
            {events.map((event, idx) => (
              <div key={event.id} className="relative flex items-start gap-4 pl-8">
                <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-white border-2 border-border flex items-center justify-center text-sm">
                  {getEventIcon(event.event_type)}
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-sm text-text-primary">{event.description}</p>
                  <p className="text-xs text-text-secondary mt-1">
                    {new Date(event.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

