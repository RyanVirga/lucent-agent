import { AppShell } from '@/components/layout/AppShell'
import { ClientHeader } from '@/components/clients/ClientHeader'
import { ClientTabs } from '@/components/clients/ClientTabs'
import { getCurrentAgentContext } from '@/lib/auth'
import { fetchClientDetail } from '@/server/db/clients'

// Force dynamic rendering since this page requires authentication
export const dynamic = 'force-dynamic'

interface ClientDetailPageProps {
  params: Promise<{ clientId: string }>
}

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const { clientId } = await params

  try {
    const { profileId, teamId } = await getCurrentAgentContext()
    const clientDetail = await fetchClientDetail(teamId, profileId, clientId)

    return (
      <AppShell>
        <div className="space-y-6">
          <ClientHeader clientDetail={clientDetail} />
          <ClientTabs clientDetail={clientDetail} />
        </div>
      </AppShell>
    )
  } catch (error) {
    return (
      <AppShell>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
          <p className="text-red-600">
            {error instanceof Error ? error.message : 'Failed to load client details'}
          </p>
        </div>
      </AppShell>
    )
  }
}

