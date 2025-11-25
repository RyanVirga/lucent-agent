'use client'

import { useState, useTransition } from 'react'
import { Save, X, Info, AlertCircle } from 'lucide-react'
import type { EmailTemplate, AudienceType, DealSide } from '@/types/database'
import { createEmailTemplate, updateEmailTemplate } from '@/app/(agent)/automations/email-templates/actions'
import { Button } from '@/components/ui/Button'

interface EmailTemplateEditorProps {
  template?: EmailTemplate | null
  onSave: () => void
  onCancel: () => void
}

const AUDIENCE_TYPES: { value: AudienceType; label: string }[] = [
  { value: 'buyer', label: 'Buyer' },
  { value: 'seller', label: 'Seller' },
  { value: 'listing_agent', label: 'Listing Agent' },
  { value: 'buying_agent', label: 'Buying Agent' },
  { value: 'escrow', label: 'Escrow Company' },
  { value: 'lender', label: 'Lender' },
  { value: 'all_parties', label: 'All Parties' },
  { value: 'internal_chat', label: 'Internal Chat' },
]

const DEAL_SIDES: { value: DealSide | ''; label: string }[] = [
  { value: '', label: 'Any (General)' },
  { value: 'buying', label: 'Buying' },
  { value: 'listing', label: 'Listing' },
]

const AVAILABLE_VARIABLES = [
  '{{property_address}}',
  '{{buyer_name}}',
  '{{seller_name}}',
  '{{agent_name}}',
  '{{coe_date}}',
  '{{inspection_deadline}}',
  '{{emd_amount}}',
  '{{price}}',
]

export function EmailTemplateEditor({ template, onSave, onCancel }: EmailTemplateEditorProps) {
  const isEditing = !!template
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    name: template?.name || '',
    key: template?.key || '',
    subject_template: template?.subject_template || '',
    body_html: template?.body_html || '',
    body_text: template?.body_text || '',
    audience_type: template?.audience_type || 'buyer',
    side: template?.side || '',
    is_active: template?.is_active ?? true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    startTransition(async () => {
      try {
        const formDataObj = new FormData()
        formDataObj.append('name', formData.name)
        formDataObj.append('key', formData.key)
        formDataObj.append('subject_template', formData.subject_template)
        formDataObj.append('body_html', formData.body_html)
        formDataObj.append('body_text', formData.body_text)
        formDataObj.append('audience_type', formData.audience_type)
        formDataObj.append('side', formData.side)
        formDataObj.append('is_active', formData.is_active.toString())
        
        let result
        if (isEditing && template) {
          result = await updateEmailTemplate(template.id, formDataObj)
        } else {
          result = await createEmailTemplate(formDataObj)
        }
        
        if (result.success) {
          onSave()
        } else {
          setError(result.error || 'Failed to save template')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      }
    })
  }

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const insertVariable = (variable: string, field: 'subject_template' | 'body_html') => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field] + variable,
    }))
  }

  return (
    <div className="h-full bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {isEditing ? 'Edit Template' : 'Create New Template'}
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {isEditing ? 'Update template details below' : 'Define a new email template for workflows'}
          </p>
        </div>
        <Button
          onClick={onCancel}
          variant="ghost"
          size="icon"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900">Error</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Basic Info Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">Basic Information</h3>
          
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Template Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              placeholder="e.g., Client Welcome Email"
              required
            />
          </div>

          <div>
            <label htmlFor="key" className="block text-sm font-medium text-gray-700 mb-1">
              Template Key <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="key"
              value={formData.key}
              onChange={(e) => handleChange('key', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              placeholder="e.g., client_welcome_v1"
              pattern="[a-z0-9_]+"
              required
            />
            <p className="text-xs text-gray-500 mt-1 flex items-start gap-1">
              <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span>Unique identifier for workflows. Use lowercase letters, numbers, and underscores only.</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="audience_type" className="block text-sm font-medium text-gray-700 mb-1">
                Audience Type <span className="text-red-500">*</span>
              </label>
              <select
                id="audience_type"
                value={formData.audience_type}
                onChange={(e) => handleChange('audience_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                required
              >
                {AUDIENCE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="side" className="block text-sm font-medium text-gray-700 mb-1">
                Deal Side
              </label>
              <select
                id="side"
                value={formData.side}
                onChange={(e) => handleChange('side', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {DEAL_SIDES.map((side) => (
                  <option key={side.value} value={side.value}>
                    {side.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => handleChange('is_active', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
              Template is active
            </label>
          </div>
        </div>

        {/* Email Content Section */}
        <div className="space-y-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Email Content</h3>
            <div className="flex flex-wrap gap-1">
              {AVAILABLE_VARIABLES.slice(0, 4).map((variable) => (
                <button
                  key={variable}
                  type="button"
                  onClick={() => insertVariable(variable, 'subject_template')}
                  className="px-2 py-0.5 text-xs font-mono bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                  title="Click to insert variable"
                >
                  {variable}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="subject_template" className="block text-sm font-medium text-gray-700 mb-1">
              Subject Line <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="subject_template"
              value={formData.subject_template}
              onChange={(e) => handleChange('subject_template', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              placeholder="e.g., Welcome to {{property_address}}"
              required
            />
          </div>

          <div>
            <label htmlFor="body_html" className="block text-sm font-medium text-gray-700 mb-1">
              Email Body (HTML) <span className="text-red-500">*</span>
            </label>
            <textarea
              id="body_html"
              value={formData.body_html}
              onChange={(e) => handleChange('body_html', e.target.value)}
              rows={12}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              placeholder="<html><body><h2>Hello {{buyer_name}}!</h2><p>Welcome to your home journey...</p></body></html>"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Use HTML tags for formatting. Variables like {AVAILABLE_VARIABLES[0]} will be replaced with actual values.
            </p>
          </div>

          <div>
            <label htmlFor="body_text" className="block text-sm font-medium text-gray-700 mb-1">
              Plain Text Version (Optional)
            </label>
            <textarea
              id="body_text"
              value={formData.body_text}
              onChange={(e) => handleChange('body_text', e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              placeholder="Plain text fallback for email clients that don't support HTML"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isPending}
            disabled={isPending}
            leftIcon={<Save className="w-4 h-4" />}
          >
            {isEditing ? 'Update Template' : 'Create Template'}
          </Button>
        </div>
      </form>
    </div>
  )
}
