'use server'

import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/server/db/supabaseClient'
import { getCurrentAgentContext } from '@/lib/auth'
import type { DealSide, PartyRole } from '@/types/database'

export type CreateDealState = {
  message?: string
  errors?: {
    [key: string]: string[]
  }
}

export async function createDeal(
  prevState: CreateDealState,
  formData: FormData
): Promise<CreateDealState> {
  let newDealId: string | null = null

  try {
    const { profileId, teamId } = await getCurrentAgentContext()

    // 1. Extract and validate form data
    const rawData = {
      clientId: formData.get('clientId') as string,
      propertyAddress: formData.get('propertyAddress') as string,
      side: formData.get('side') as DealSide,
      price: formData.get('price') as string,
      targetDate: formData.get('targetDate') as string,
      status: 'active', // Defaulting to active as per new requirement
      notes: formData.get('notes') as string,
    }

    // 2. Validate required fields
    const errors: Record<string, string[]> = {}
    
    if (!rawData.clientId?.trim()) {
      errors.clientId = ['Client selection is required']
    }
    if (!rawData.propertyAddress?.trim()) {
      errors.propertyAddress = ['Property address is required']
    }
    if (!rawData.side || !['buying', 'listing'].includes(rawData.side)) {
      errors.side = ['Please select a deal side (Buying or Listing)']
    }

    if (Object.keys(errors).length > 0) {
      return { errors, message: 'Please fix the errors below' }
    }

    // 3. Fetch client details to ensure existence and get contact info
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('id', rawData.clientId)
      .eq('team_id', teamId) // Ensure client belongs to agent's team
      .single()

    if (clientError || !client) {
      return { message: 'Selected client not found or access denied.' }
    }

    // 4. Create the deal record
    const { data: deal, error: dealError } = await supabaseAdmin
      .from('deals')
      .insert({
        team_id: teamId,
        primary_agent_id: profileId,
        property_address: rawData.propertyAddress.trim(),
        price: rawData.price ? parseFloat(rawData.price) : null,
        target_date: rawData.targetDate ? new Date(rawData.targetDate).toISOString() : null,
        // If it's a lead/potential deal, we might not have a close date yet, but target_date acts as such
        close_date: rawData.targetDate ? new Date(rawData.targetDate).toISOString() : null,
        side: rawData.side,
        status: rawData.status,
      })
      .select()
      .single()

    if (dealError) {
      console.error('Deal creation error:', dealError)
      throw new Error(`Failed to create deal: ${dealError.message}`)
    }
    
    newDealId = deal.id

    // 5. Create deal party (link client to deal)
    // Determine role based on side
    const partyRole: PartyRole = rawData.side === 'buying' ? 'buyer' : 'seller'

    const { error: partyError } = await supabaseAdmin
      .from('deal_parties')
      .insert({
        deal_id: deal.id,
        client_id: client.id,
        role: partyRole,
        name: `${client.first_name} ${client.last_name}`,
        email: client.email,
        phone: client.phone,
      })

    if (partyError) {
      console.error('Deal party creation error:', partyError)
      // Non-critical, but bad. We continue.
    }

    // 6. Create Internal Note if provided
    if (rawData.notes?.trim()) {
      await supabaseAdmin.from('notes').insert({
        team_id: teamId,
        deal_id: deal.id,
        client_id: client.id,
        author_profile_id: profileId,
        body: rawData.notes.trim(),
        is_internal: true
      })
    }

    // 7. Initialize Workflow (Auto-start)
    // Find appropriate workflow definition
    const { data: workflowDef, error: wfError } = await supabaseAdmin
      .from('workflow_definitions')
      .select('id')
      .eq('side', rawData.side)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()

    if (!wfError && workflowDef) {
      const { error: runError } = await supabaseAdmin
        .from('workflow_runs')
        .insert({
          deal_id: deal.id,
          workflow_definition_id: workflowDef.id,
          status: 'active',
        })

      if (runError) {
        console.error('Workflow run creation error:', runError)
      } else {
        // Create a timeline event for workflow start
         await supabaseAdmin
        .from('deal_timeline_events')
        .insert({
          deal_id: deal.id,
          event_type: 'workflow_started',
          description: `Started ${rawData.side} workflow`,
          created_by: profileId,
        })
      }
    }

    // Create a timeline event for deal creation
    await supabaseAdmin
      .from('deal_timeline_events')
      .insert({
        deal_id: deal.id,
        event_type: 'deal_created',
        description: `Deal created for ${client.first_name} ${client.last_name}`,
        created_by: profileId,
      })

  } catch (error) {
    console.error('Create deal error:', error)
    return {
      message: error instanceof Error ? error.message : 'Failed to create deal. Please try again.',
    }
  }

  // Redirect to the new deal page
  if (newDealId) {
    redirect(`/deals/${newDealId}`)
  }
  
  return { message: 'Unknown error occurred' }
}
