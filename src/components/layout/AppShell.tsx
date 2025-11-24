'use client'

import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

interface AppShellProps {
  children: React.ReactNode
  firstName?: string
}

export function AppShell({ children, firstName }: AppShellProps) {
  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar firstName={firstName} />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}

