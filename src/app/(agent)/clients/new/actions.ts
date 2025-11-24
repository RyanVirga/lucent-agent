'use server'

import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/server/db/supabaseClient'
import { getCurrentAgentContext } from '@/lib/auth'
import type { DealSide, PartyRole } from '@/types/database'

export type CreateClientState = {
  message?: string
  errors?: {
    [key: string]: string[]
  }
}

interface DealData {
  property_address: string
  mls_url: string | null
  price: number | null
  target_date: string | null
  close_date: string | null
  side: DealSide
  status: string
  party_role: PartyRole
}

export async function createClient(
  prevState: CreateClientState,
  formData: FormData
): Promise<CreateClientState> {
  try {
    const { profileId, teamId } = await getCurrentAgentContext()

    // 1. Extract and validate form data
    const rawData = {
      type: formData.get('type') as string,
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      preferredContactMethod: formData.get('preferredContactMethod') as string,
      preferredLanguage: formData.get('preferredLanguage') as string,
      coClientName: formData.get('coClientName') as string,
      coClientEmail: formData.get('coClientEmail') as string,
      notes: formData.get('notes') as string,
      // Property fields
      addProperty: formData.get('addProperty') === 'on',
      propertyAddress: formData.get('propertyAddress') as string,
      mlsUrl: formData.get('mlsUrl') as string,
      price: formData.get('price') as string,
      targetDate: formData.get('targetDate') as string,
    }

    // 2. Validate required fields
    const errors: Record<string, string[]> = {}
    
    if (!rawData.firstName?.trim()) {
      errors.firstName = ['First name is required']
    }
    if (!rawData.lastName?.trim()) {
      errors.lastName = ['Last name is required']
    }
    if (!rawData.email?.trim()) {
      errors.email = ['Email is required']
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawData.email)) {
      errors.email = ['Please enter a valid email address']
    }
    if (!rawData.phone?.trim()) {
      errors.phone = ['Phone number is required']
    }
    if (!rawData.type || !['buyer', 'seller', 'both'].includes(rawData.type)) {
      errors.type = ['Please select a client type']
    }

    if (Object.keys(errors).length > 0) {
      return { errors, message: 'Please fix the errors below' }
    }

    // 3. Create the client record
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .insert({
        team_id: teamId,
        first_name: rawData.firstName.trim(),
        last_name: rawData.lastName.trim(),
        email: rawData.email.trim(),
        phone: rawData.phone.trim(),
        preferred_language: rawData.preferredLanguage || 'en',
        type: rawData.type,
        preferred_contact_method: rawData.preferredContactMethod || 'email',
        co_client_name: rawData.coClientName?.trim() || null,
        co_client_email: rawData.coClientEmail?.trim() || null,
        notes: rawData.notes?.trim() || null,
      })
      .select()
      .single()

    if (clientError) {
      console.error('Client creation error:', clientError)
      throw new Error(`Failed to create client: ${clientError.message}`)
    }

    // 4. Link agent to client
    const { error: linkError } = await supabaseAdmin
      .from('agent_clients')
      .insert({
        team_id: teamId,
        agent_id: profileId,
        client_id: client.id,
        is_primary: true,
        role_on_client: 'primary',
      })

    if (linkError) {
      console.error('Agent-client link error:', linkError)
      throw new Error(`Failed to link agent to client: ${linkError.message}`)
    }

    // 5. Create portal invite
    const { error: inviteError } = await supabaseAdmin
      .from('portal_invites')
      .insert({
        client_id: client.id,
        email: rawData.email.trim(),
        status: 'sent',
      })

    if (inviteError) {
      console.error('Portal invite creation error:', inviteError)
      // Non-critical error, log but continue
    }

    // 6. Prepare property data
    const propertyAddress = rawData.addProperty && rawData.propertyAddress?.trim()
      ? rawData.propertyAddress.trim()
      : 'TBD'
    
    const mlsUrl = rawData.addProperty && rawData.mlsUrl?.trim()
      ? rawData.mlsUrl.trim()
      : null
    
    const price = rawData.addProperty && rawData.price
      ? parseFloat(rawData.price)
      : null
    
    const targetDate = rawData.addProperty && rawData.targetDate
      ? new Date(rawData.targetDate).toISOString()
      : null

    // 7. Create deals based on client type
    const dealsToCreate: DealData[] = []

    if (rawData.type === 'buyer' || rawData.type === 'both') {
      dealsToCreate.push({
        property_address: propertyAddress,
        mls_url: mlsUrl,
        price: price,
        target_date: targetDate,
        close_date: targetDate,
        side: 'buying' as DealSide,
        status: 'pre_approval',
        party_role: 'buyer' as PartyRole,
      })
    }

    if (rawData.type === 'seller' || rawData.type === 'both') {
      dealsToCreate.push({
        property_address: propertyAddress,
        mls_url: mlsUrl,
        price: price,
        target_date: targetDate,
        close_date: targetDate,
        side: 'listing' as DealSide,
        status: 'pre_listing',
        party_role: 'seller' as PartyRole,
      })
    }

    // 8. Create each deal with parties and workflows
    for (const dealData of dealsToCreate) {
      // Create deal
      const { data: deal, error: dealError } = await supabaseAdmin
        .from('deals')
        .insert({
          team_id: teamId,
          primary_agent_id: profileId,
          property_address: dealData.property_address,
          mls_url: dealData.mls_url,
          price: dealData.price,
          target_date: dealData.target_date,
          close_date: dealData.close_date,
          side: dealData.side,
          status: dealData.status,
        })
        .select()
        .single()

      if (dealError) {
        console.error('Deal creation error:', dealError)
        continue // Log error but continue with other deals
      }

      // Create deal party (link client to deal)
      const { error: partyError } = await supabaseAdmin
        .from('deal_parties')
        .insert({
          deal_id: deal.id,
          client_id: client.id,
          role: dealData.party_role,
          name: `${client.first_name} ${client.last_name}`,
          email: client.email,
          phone: client.phone,
        })

      if (partyError) {
        console.error('Deal party creation error:', partyError)
      }

      // Find appropriate workflow definition and create workflow run
      const { data: workflowDef, error: wfError } = await supabaseAdmin
        .from('workflow_definitions')
        .select('id')
        .eq('side', dealData.side)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle()

      if (wfError) {
        console.error('Workflow definition lookup error:', wfError)
      } else if (workflowDef) {
        const { error: runError } = await supabaseAdmin
          .from('workflow_runs')
          .insert({
            deal_id: deal.id,
            workflow_definition_id: workflowDef.id,
            status: 'active',
          })

        if (runError) {
          console.error('Workflow run creation error:', runError)
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
          metadata: {
            client_type: rawData.type,
            has_property: rawData.addProperty,
          },
        })
    }

    // Success - redirect will happen after this function returns
  } catch (error) {
    console.error('Create client error:', error)
    return {
      message: error instanceof Error ? error.message : 'Failed to create client. Please try again.',
    }
  }

  // Redirect outside of try/catch to avoid catching redirect errors
  redirect('/clients')
}

