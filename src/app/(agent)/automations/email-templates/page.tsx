'use client'

import { useEffect, useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { EmailTemplatesTable } from '@/components/automation/EmailTemplatesTable'
import { EmailTemplatePreview } from '@/components/automation/EmailTemplatePreview'
import { EmailTemplateEditor } from '@/components/automation/EmailTemplateEditor'
import { Mail, Plus, Filter, LayoutGrid, List as ListIcon } from 'lucide-react'
import type { EmailTemplate, AudienceType } from '@/types/database'
import { getEmailTemplates } from './actions'
import { Button } from '@/components/ui/Button'

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [view, setView] = useState<'list' | 'grid'>('list')
  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const loadTemplates = async () => {
    setLoading(true)
    try {
      const data = await getEmailTemplates()
      setTemplates(data)
    } catch (error) {
      console.error('Failed to load templates:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTemplates()
  }, [])

  const filteredTemplates = templates.filter((template) =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.subject_template.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleNewTemplate = () => {
    setSelectedTemplate(null)
    setIsEditing(false)
    setIsCreating(true)
  }

  const handleEditTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template)
    setIsCreating(false)
    setIsEditing(true)
  }

  const handleSave = async () => {
    await loadTemplates()
    setIsCreating(false)
    setIsEditing(false)
    setSelectedTemplate(null)
  }

  const handleCancel = () => {
    setIsCreating(false)
    setIsEditing(false)
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="flex flex-col h-[calc(100vh-100px)] gap-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
              Email Templates
            </h1>
            <p className="text-sm text-text-secondary mt-1">
              Manage and preview your automated email templates
            </p>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex items-center bg-white border border-border rounded-xl p-1">
              <Button
                variant={view === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setView('list')}
                className={`w-8 h-8 rounded-lg ${view === 'list' ? 'bg-gray-100' : ''} border-none shadow-none`}
              >
                <ListIcon className="w-4 h-4" />
              </Button>
              <Button
                variant={view === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setView('grid')}
                className={`w-8 h-8 rounded-lg ${view === 'grid' ? 'bg-gray-100' : ''} border-none shadow-none`}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
            </div>
            <Button
              onClick={handleNewTemplate}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              New Template
            </Button>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
           <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between shadow-sm">
             <div>
               <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Templates</p>
               <p className="text-2xl font-semibold text-gray-900 mt-1">{templates.length}</p>
             </div>
             <div className="p-2 bg-gray-50 rounded-lg text-gray-500">
               <Mail className="w-5 h-5" />
             </div>
           </div>
           <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between shadow-sm">
             <div>
               <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Buyer Templates</p>
               <p className="text-2xl font-semibold text-gray-900 mt-1">
                 {templates.filter((t) => t.audience_type === 'buyer').length}
               </p>
             </div>
             <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
               <Mail className="w-5 h-5" />
             </div>
           </div>
           <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between shadow-sm">
             <div>
               <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Seller Templates</p>
               <p className="text-2xl font-semibold text-gray-900 mt-1">
                 {templates.filter((t) => t.audience_type === 'seller').length}
               </p>
             </div>
             <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
               <Mail className="w-5 h-5" />
             </div>
           </div>
        </div>

        {/* Main Content Area - Split View */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-4 h-full flex flex-col min-h-0">
            <EmailTemplatesTable
              templates={filteredTemplates}
              onSelectTemplate={setSelectedTemplate}
              selectedTemplateId={selectedTemplate?.id}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              view={view}
            />
          </div>
          <div className="lg:col-span-8 h-full min-h-0 overflow-y-auto">
            {isCreating || isEditing ? (
              <EmailTemplateEditor 
                template={isEditing ? selectedTemplate : null}
                onSave={handleSave}
                onCancel={handleCancel}
              />
            ) : (
              <EmailTemplatePreview 
                template={selectedTemplate}
                onEdit={handleEditTemplate}
              />
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
