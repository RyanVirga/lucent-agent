import { AppShell } from '@/components/layout/AppShell'
import { NewDealForm } from './NewDealForm'
import { getCurrentAgentContext } from '@/lib/auth'
import { fetchAgentClientsWithDeals } from '@/server/db/clients'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function NewDealPage() {
  const { teamId, profileId } = await getCurrentAgentContext()
  
  // Fetch clients to populate the dropdown
  // We reuse fetchAgentClientsWithDeals for convenience as it handles auth scopes
  const clientsWithDeals = await fetchAgentClientsWithDeals(teamId, profileId)
  
  // Extract just the client objects for the dropdown
  const clients = clientsWithDeals.map(cwd => cwd.client).sort((a, b) => 
    a.first_name.localeCompare(b.first_name)
  )

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto pb-20">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link 
            href="/dashboard" 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-text-secondary"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Create New Deal</h1>
            <p className="text-text-secondary text-sm">Start a new transaction for an existing client.</p>
          </div>
        </div>

        <NewDealForm clients={clients} />
      </div>
    </AppShell>
  )
}

