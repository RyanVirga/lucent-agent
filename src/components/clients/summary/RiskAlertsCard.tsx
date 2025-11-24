import { AlertTriangle, Info, AlertCircle } from 'lucide-react'
import type { Alert } from '@/types/database'

interface RiskAlertsCardProps {
  alerts: Alert[]
}

export function RiskAlertsCard({ alerts }: RiskAlertsCardProps) {
  const unreadAlerts = alerts.filter(a => !a.is_read)

  if (unreadAlerts.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Risk Alerts</h3>
        <p className="text-text-secondary text-sm">No active alerts</p>
      </div>
    )
  }

  const getAlertIcon = (level: string) => {
    switch (level) {
      case 'critical':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />
      default:
        return <Info className="w-5 h-5 text-blue-500" />
    }
  }

  const getAlertColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'warning':
        return 'bg-orange-50 border-orange-200 text-orange-800'
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800'
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-6">
      <h3 className="text-lg font-semibold text-text-primary mb-4">Risk Alerts</h3>
      <div className="space-y-3">
        {unreadAlerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-4 rounded-lg border ${getAlertColor(alert.level)}`}
          >
            <div className="flex items-start gap-3">
              {getAlertIcon(alert.level)}
              <div className="flex-1">
                <div className="font-semibold mb-1">
                  {alert.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </div>
                <div className="text-sm">{alert.message}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

