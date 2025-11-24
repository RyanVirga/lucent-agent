'use client'

import { Mail, Search, User, UserCheck, Inbox, ChevronRight } from 'lucide-react'
import type { EmailTemplate } from '@/types/database'

interface EmailTemplatesTableProps {
  templates: EmailTemplate[]
  onSelectTemplate?: (template: EmailTemplate) => void
  selectedTemplateId?: string | null
  searchQuery?: string
  onSearchChange?: (query: string) => void
  view?: 'list' | 'grid'
}

export function EmailTemplatesTable({
  templates,
  onSelectTemplate,
  selectedTemplateId,
  searchQuery = '',
  onSearchChange,
  view = 'list',
}: EmailTemplatesTableProps) {
  const getAudienceIcon = (audience: string | null) => {
    if (audience === 'buyer') return User
    if (audience === 'seller') return UserCheck
    return Mail
  }

  const getAudienceColor = (audience: string | null) => {
    if (audience === 'buyer') return 'bg-blue-100 text-blue-700 border-blue-200'
    if (audience === 'seller') return 'bg-purple-100 text-purple-700 border-purple-200'
    return 'bg-gray-100 text-gray-700 border-gray-200'
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Search Header */}
      <div className="p-4 border-b border-gray-100 bg-gray-50/50">
        {onSearchChange && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
        )}
      </div>

      {/* Template List */}
      <div className="flex-1 overflow-y-auto min-h-0 bg-white">
        {templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 px-4 text-center">
            <div className="p-3 bg-gray-50 rounded-full mb-3">
              <Inbox className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-gray-900 font-medium text-sm">No templates found</p>
            <p className="text-gray-500 text-xs mt-1">
              {searchQuery ? 'Try adjusting your search terms' : 'Get started by creating a new template'}
            </p>
          </div>
        ) : (
          <div className={view === 'grid' ? "p-4 grid grid-cols-1 gap-4" : "divide-y divide-gray-100"}>
            {templates.map((template) => {
              const isSelected = selectedTemplateId === template.id
              const AudienceIcon = getAudienceIcon(template.audience_type)
              
              if (view === 'grid') {
                 return (
                  <button
                    key={template.id}
                    onClick={() => onSelectTemplate?.(template)}
                    className={`text-left p-4 rounded-xl border transition-all duration-200 group relative flex flex-col gap-3
                      ${isSelected 
                        ? 'bg-blue-50 border-blue-200 shadow-sm ring-1 ring-blue-200' 
                        : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between w-full">
                      <div className={`p-2 rounded-lg ${
                        template.audience_type === 'buyer'
                          ? 'bg-blue-100/50 text-blue-600'
                          : template.audience_type === 'seller'
                          ? 'bg-purple-100/50 text-purple-600'
                          : 'bg-gray-100/50 text-gray-600'
                      }`}>
                        <AudienceIcon className="w-4 h-4" />
                      </div>
                       <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${getAudienceColor(template.audience_type)}`}>
                        {template.audience_type || 'General'}
                      </span>
                    </div>
                    
                    <div>
                      <h3 className={`font-semibold text-sm mb-1 line-clamp-1 ${isSelected ? 'text-blue-700' : 'text-gray-900'}`}>
                        {template.name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                      </h3>
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {template.subject_template}
                      </p>
                    </div>
                  </button>
                 )
              }

              return (
                <button
                  key={template.id}
                  onClick={() => onSelectTemplate?.(template)}
                  className={`w-full text-left p-4 transition-all hover:bg-gray-50 group relative
                    ${isSelected ? 'bg-blue-50/50 hover:bg-blue-50/80' : ''}
                  `}
                >
                  {isSelected && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
                  )}
                  
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 p-1.5 rounded-md flex-shrink-0 ${
                      template.audience_type === 'buyer'
                        ? 'bg-blue-100/50 text-blue-600'
                        : template.audience_type === 'seller'
                        ? 'bg-purple-100/50 text-purple-600'
                        : 'bg-gray-100/50 text-gray-600'
                    }`}>
                      <AudienceIcon className="w-4 h-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                         <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${getAudienceColor(template.audience_type)}`}>
                          {template.audience_type ? template.audience_type.charAt(0).toUpperCase() + template.audience_type.slice(1) : 'General'}
                        </span>
                        <ChevronRight className={`w-4 h-4 text-gray-300 transition-transform ${isSelected ? 'text-blue-400 translate-x-0.5' : 'group-hover:text-gray-400'}`} />
                      </div>
                      
                      <h3 className={`text-sm font-semibold mb-1 truncate ${
                        isSelected ? 'text-blue-700' : 'text-gray-900'
                      }`}>
                        {template.name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                      </h3>
                      
                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                        {template.subject_template}
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
