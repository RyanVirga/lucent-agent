'use client'

import { Sunrise, Sun, Moon } from 'lucide-react'

export function Topbar({ firstName }: { firstName?: string }) {
  const greeting = getGreeting()
  const displayName = firstName || 'Agent'
  const GreetingIcon = getGreetingIcon()

  return (
    <div className="h-20 border-b border-border/50 bg-white/80 backdrop-blur-sm px-6 lg:px-8 flex items-center shadow-sm">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white shadow-md">
          <GreetingIcon className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-text-primary">
            {greeting}, {displayName}
          </h2>
          <p className="text-sm text-text-secondary font-medium">
            Here&apos;s what Lucent is coordinating for you today
          </p>
        </div>
      </div>
    </div>
  )
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function getGreetingIcon() {
  const hour = new Date().getHours()
  if (hour < 12) return Sunrise
  if (hour < 17) return Sun
  return Moon
}

