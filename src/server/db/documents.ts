// Data access functions for client documents
import { supabaseAdmin } from './supabaseClient'
import type { ClientDocument } from '@/types/clients'
import type { DocPacketDocument, Deal } from '@/types/database'

/**
 * Fetch all documents for a client's deals
 */
export async function fetchClientDocuments(
  teamId: string,
  agentId: string,
  clientId: string
): Promise<ClientDocument[]> {
  // Verify agent has access to this client
  const { data: agentClient, error: acError } = await supabaseAdmin
    .from('agent_clients')
    .select('*')
    .eq('team_id', teamId)
    .eq('agent_id', agentId)
    .eq('client_id', clientId)
    .single()

  if (acError || !agentClient) {
    throw new Error('Client not found or access denied')
  }

  // Fetch all deals for this client
  const { data: deals, error: dealsError } = await supabaseAdmin
    .from('deals')
    .select('id')
    .or(`primary_agent_id.eq.${agentId},id.in.(
      SELECT deal_id FROM deal_parties WHERE client_id.eq.${clientId}
    )`)
    .eq('team_id', teamId)

  if (dealsError) {
    throw new Error(`Failed to fetch deals: ${dealsError.message}`)
  }

  const dealIds = (deals || []).map((d: any) => d.id)

  // Fetch documents
  const { data: documents, error: docsError } = await supabaseAdmin
    .from('doc_packet_documents')
    .select('*')
    .or(`client_id.eq.${clientId},deal_id.in.(${dealIds.length > 0 ? dealIds.join(',') : 'null'})`)
    .order('created_at', { ascending: false })

  if (docsError) {
    throw new Error(`Failed to fetch documents: ${docsError.message}`)
  }

  // Fetch deal info for each document
  const documentsWithDeals: ClientDocument[] = await Promise.all(
    (documents || []).map(async (doc: DocPacketDocument) => {
      let deal: Deal | null = null
      
      if (doc.deal_id) {
        const { data: dealData } = await supabaseAdmin
          .from('deals')
          .select('*')
          .eq('id', doc.deal_id)
          .single()
        
        deal = dealData as Deal | null
      }

      // Determine status flags (simplified - in production, check actual status)
      const statusFlags = {
        superseded: false, // Would check if newer version exists
        signatureMissing: false, // Would check signature status
      }

      return {
        document: doc,
        deal,
        docType: doc.doc_type,
        lastUpdated: doc.created_at,
        statusFlags,
      }
    })
  )

  return documentsWithDeals
}

