'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, Mail, Users } from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Email Templates', href: '/automations/email-templates', icon: Mail },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col bg-white/80 backdrop-blur-sm border-r border-border/50 shadow-sm">
      <div className="flex h-20 items-center px-6 border-b border-border/50 bg-gradient-to-r from-blue-50/50 to-cyan-50/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
            L
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Lucent Agent
          </h1>
        </div>
      </div>
      <nav className="flex-1 space-y-2 px-4 py-6">
        {navigation.map((item) => {
          const isActive = pathname?.startsWith(item.href)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200
                ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md shadow-blue-500/30'
                    : 'text-text-secondary hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 hover:text-text-primary'
                }
              `}
            >
              <item.icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

