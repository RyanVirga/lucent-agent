'use server'

import { supabaseAdmin } from '@/server/db/supabaseClient'
import { getCurrentAgentContext } from '@/lib/auth'
import type { EmailTemplate, AudienceType, DealSide } from '@/types/database'

export type EmailTemplateActionState = {
  message?: string
  errors?: {
    [key: string]: string[]
  }
}

/**
 * Get all email templates for the current team
 */
export async function getEmailTemplates(): Promise<EmailTemplate[]> {
  try {
    const { teamId } = await getCurrentAgentContext()
    
    const { data, error } = await supabaseAdmin
      .from('email_templates')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Failed to fetch email templates:', error)
      return []
    }
    
    return data || []
  } catch (error) {
    console.error('Error fetching email templates:', error)
    return []
  }
}

/**
 * Create a new email template
 */
export async function createEmailTemplate(
  formData: FormData
): Promise<{ success: boolean; error?: string; data?: EmailTemplate }> {
  try {
    const { teamId } = await getCurrentAgentContext()
    
    // Extract form data
    const name = formData.get('name') as string
    const key = formData.get('key') as string
    const subjectTemplate = formData.get('subject_template') as string
    const bodyHtml = formData.get('body_html') as string
    const bodyText = formData.get('body_text') as string
    const audienceType = formData.get('audience_type') as AudienceType
    const side = formData.get('side') as DealSide | null
    const isActive = formData.get('is_active') === 'true'
    
    // Validate required fields
    const errors: Record<string, string[]> = {}
    
    if (!name?.trim()) {
      errors.name = ['Template name is required']
    }
    if (!key?.trim()) {
      errors.key = ['Template key is required']
    } else if (!/^[a-z0-9_]+$/.test(key)) {
      errors.key = ['Key must contain only lowercase letters, numbers, and underscores']
    }
    if (!subjectTemplate?.trim()) {
      errors.subject_template = ['Subject line is required']
    }
    if (!bodyHtml?.trim()) {
      errors.body_html = ['Email body is required']
    }
    if (!audienceType) {
      errors.audience_type = ['Audience type is required']
    }
    
    if (Object.keys(errors).length > 0) {
      return { 
        success: false, 
        error: 'Validation failed: ' + Object.values(errors).flat().join(', ')
      }
    }
    
    // Check if key already exists
    const { data: existing } = await supabaseAdmin
      .from('email_templates')
      .select('id')
      .eq('key', key)
      .single()
    
    if (existing) {
      return { 
        success: false, 
        error: 'A template with this key already exists. Please use a unique key.'
      }
    }
    
    // Insert new template
    const { data, error } = await supabaseAdmin
      .from('email_templates')
      .insert({
        name: name.trim(),
        key: key.trim(),
        subject_template: subjectTemplate.trim(),
        body_html: bodyHtml.trim(),
        body_text: bodyText?.trim() || null,
        audience_type: audienceType,
        side: side || null,
        is_active: isActive,
      })
      .select()
      .single()
    
    if (error) {
      console.error('Failed to create email template:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true, data }
  } catch (error) {
    console.error('Error creating email template:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create template'
    }
  }
}

/**
 * Update an existing email template
 */
export async function updateEmailTemplate(
  id: string,
  formData: FormData
): Promise<{ success: boolean; error?: string; data?: EmailTemplate }> {
  try {
    const { teamId } = await getCurrentAgentContext()
    
    // Extract form data
    const name = formData.get('name') as string
    const key = formData.get('key') as string
    const subjectTemplate = formData.get('subject_template') as string
    const bodyHtml = formData.get('body_html') as string
    const bodyText = formData.get('body_text') as string
    const audienceType = formData.get('audience_type') as AudienceType
    const side = formData.get('side') as DealSide | null
    const isActive = formData.get('is_active') === 'true'
    
    // Validate required fields
    const errors: Record<string, string[]> = {}
    
    if (!name?.trim()) {
      errors.name = ['Template name is required']
    }
    if (!key?.trim()) {
      errors.key = ['Template key is required']
    } else if (!/^[a-z0-9_]+$/.test(key)) {
      errors.key = ['Key must contain only lowercase letters, numbers, and underscores']
    }
    if (!subjectTemplate?.trim()) {
      errors.subject_template = ['Subject line is required']
    }
    if (!bodyHtml?.trim()) {
      errors.body_html = ['Email body is required']
    }
    if (!audienceType) {
      errors.audience_type = ['Audience type is required']
    }
    
    if (Object.keys(errors).length > 0) {
      return { 
        success: false, 
        error: 'Validation failed: ' + Object.values(errors).flat().join(', ')
      }
    }
    
    // Check if key already exists on a different template
    const { data: existing } = await supabaseAdmin
      .from('email_templates')
      .select('id')
      .eq('key', key)
      .neq('id', id)
      .single()
    
    if (existing) {
      return { 
        success: false, 
        error: 'A template with this key already exists. Please use a unique key.'
      }
    }
    
    // Update template
    const { data, error } = await supabaseAdmin
      .from('email_templates')
      .update({
        name: name.trim(),
        key: key.trim(),
        subject_template: subjectTemplate.trim(),
        body_html: bodyHtml.trim(),
        body_text: bodyText?.trim() || null,
        audience_type: audienceType,
        side: side || null,
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Failed to update email template:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true, data }
  } catch (error) {
    console.error('Error updating email template:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update template'
    }
  }
}

/**
 * Delete an email template
 */
export async function deleteEmailTemplate(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { teamId } = await getCurrentAgentContext()
    
    const { error } = await supabaseAdmin
      .from('email_templates')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Failed to delete email template:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting email template:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete template'
    }
  }
}

