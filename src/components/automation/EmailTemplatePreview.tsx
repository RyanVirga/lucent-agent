'use client'

import { Eye, Mail, User, FileText, Code, Edit2, Copy, MoreHorizontal, ArrowLeft, Calendar, Info } from 'lucide-react'
import { useState } from 'react'
import type { EmailTemplate } from '@/types/database'
import { Button } from '@/components/ui/Button'

interface EmailTemplatePreviewProps {
  template: EmailTemplate | null
  onEdit?: (template: EmailTemplate) => void
}

export function EmailTemplatePreview({ template, onEdit }: EmailTemplatePreviewProps) {
  const [viewMode, setViewMode] = useState<'preview' | 'html' | 'text'>('preview')

  if (!template) {
    return (
      <div className="h-full bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
          <Mail className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No template selected</h3>
        <p className="text-gray-500 max-w-xs mx-auto">
          Select an email template from the list to view its details, edit content, or see a preview.
        </p>
      </div>
    )
  }

  const getAudienceColor = (audience: string | null) => {
    if (audience === 'buyer') return 'bg-blue-50 text-blue-700 border-blue-200'
    if (audience === 'seller') return 'bg-purple-50 text-purple-700 border-purple-200'
    return 'bg-gray-50 text-gray-700 border-gray-200'
  }

  return (
    <div className="h-full bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-900">Template Preview</h2>
          <div className="h-4 w-px bg-gray-200" />
          <div className="flex bg-gray-100 p-0.5 rounded-lg">
            <Button
              onClick={() => setViewMode('preview')}
              variant={viewMode === 'preview' ? 'secondary' : 'ghost'}
              size="sm"
              className={`text-xs ${viewMode === 'preview' ? 'shadow-sm bg-white' : ''}`}
            >
              Visual
            </Button>
            <Button
              onClick={() => setViewMode('html')}
              variant={viewMode === 'html' ? 'secondary' : 'ghost'}
              size="sm"
              className={`text-xs ${viewMode === 'html' ? 'shadow-sm bg-white' : ''}`}
            >
              HTML
            </Button>
            {template.body_text && (
              <Button
                onClick={() => setViewMode('text')}
                variant={viewMode === 'text' ? 'secondary' : 'ghost'}
                size="sm"
                className={`text-xs ${viewMode === 'text' ? 'shadow-sm bg-white' : ''}`}
              >
                Text
              </Button>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Copy className="w-4 h-4" />
          </Button>
          {onEdit && (
            <Button 
              onClick={() => onEdit(template)}
              size="sm"
              leftIcon={<Edit2 className="w-4 h-4" />}
            >
              Edit Template
            </Button>
          )}
        </div>
      </div>

      {/* Email Header Info */}
      <div className="px-6 py-5 bg-gray-50/50 border-b border-gray-100 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 mb-1">
              {template.name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
            </h1>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Calendar className="w-3 h-3" />
              <span>Last updated {template.updated_at ? new Date(template.updated_at).toLocaleDateString() : 'recently'}</span>
            </div>
          </div>
          <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${getAudienceColor(template.audience_type)}`}>
            {template.audience_type ? template.audience_type.charAt(0).toUpperCase() + template.audience_type.slice(1) : 'General'} Audience
          </span>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm space-y-3">
          <div className="flex items-baseline gap-3">
            <span className="text-xs font-semibold text-gray-500 w-12 text-right">Subject</span>
            <span className="text-sm font-medium text-gray-900">{template.subject_template}</span>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-xs font-semibold text-gray-500 w-12 text-right">To</span>
            <div className="flex flex-wrap gap-2">
               <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                 {'{client_email}'}
               </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto bg-gray-50/30 p-6">
        {viewMode === 'preview' && (
          <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[400px]">
            <div className="border-b border-gray-100 bg-gray-50/50 px-4 py-2 flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
            </div>
            <div className="p-8 prose prose-sm max-w-none text-gray-800">
               <div dangerouslySetInnerHTML={{ __html: template.body_html }} />
            </div>
          </div>
        )}

        {viewMode === 'html' && (
          <div className="max-w-3xl mx-auto bg-gray-900 rounded-xl shadow-sm overflow-hidden border border-gray-800">
            <div className="border-b border-gray-800 bg-gray-950 px-4 py-2 flex items-center justify-between">
              <span className="text-xs font-mono text-gray-400">source.html</span>
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-gray-700"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-gray-700"></div>
              </div>
            </div>
            <pre className="p-6 text-sm font-mono text-gray-300 overflow-x-auto whitespace-pre-wrap">
              {template.body_html}
            </pre>
          </div>
        )}

        {viewMode === 'text' && template.body_text && (
          <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
             <div className="border-b border-gray-100 bg-gray-50/50 px-4 py-2 flex items-center justify-between">
              <span className="text-xs font-mono text-gray-500">plain_text.txt</span>
            </div>
            <pre className="p-8 text-sm font-mono text-gray-800 whitespace-pre-wrap">
              {template.body_text}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
