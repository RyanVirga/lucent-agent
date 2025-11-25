import { Suspense } from 'react'
import { Plus } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { ClientsFilterBar } from '@/components/clients/ClientsFilterBar'
import { ClientsTable } from '@/components/clients/ClientsTable'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { getCurrentAgentContext } from '@/lib/auth'
import { fetchAgentClientsWithDeals } from '@/server/db/clients'
import type { ClientFilters, DealStatus, DealSide } from '@/types/clients'

// Force dynamic rendering since this page requires authentication
export const dynamic = 'force-dynamic'

interface ClientsPageProps {
  searchParams: Promise<{
    search?: string
    status?: string
    side?: string
    closingThisWeek?: string
    closingThisMonth?: string
  }>
}

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  const params = await searchParams
  
  try {
    const { profileId, teamId } = await getCurrentAgentContext()

    // Build filters from search params
    const filters: ClientFilters = {}

    if (params.search) {
      filters.search = params.search
    }

    if (params.status) {
      filters.status = params.status.split(',') as DealStatus[]
    }

    if (params.side) {
      filters.side = params.side.split(',') as DealSide[]
    }

    if (params.closingThisWeek === 'true') {
      filters.closingThisWeek = true
    }

    if (params.closingThisMonth === 'true') {
      filters.closingThisMonth = true
    }

    const clients = await fetchAgentClientsWithDeals(teamId, profileId, filters)

    return (
      <AppShell>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Clients</h1>
              <p className="text-sm text-text-secondary mt-1">Manage your clients and their transactions</p>
            </div>
            <ButtonLink
              href="/clients/new"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              New Client
            </ButtonLink>
          </div>

          <Suspense fallback={<div className="animate-pulse bg-gray-100 h-64 rounded-2xl"></div>}>
            <ClientsFilterBar />
          </Suspense>

          <Suspense fallback={<ClientsTable clients={[]} loading={true} />}>
            <ClientsTable clients={clients} />
          </Suspense>
        </div>
      </AppShell>
    )
  } catch (error) {
    return (
      <AppShell>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
          <p className="text-red-600">
            {error instanceof Error ? error.message : 'Failed to load clients'}
          </p>
        </div>
      </AppShell>
    )
  }
}

