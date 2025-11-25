'use client'

import { useState, useEffect, useCallback } from 'react'
import { FileText, ExternalLink } from 'lucide-react'
import type { ClientDocument } from '@/types/clients'

interface ClientDocumentsTabProps {
  clientId: string
}

export function ClientDocumentsTab({ clientId }: ClientDocumentsTabProps) {
  const [documents, setDocuments] = useState<ClientDocument[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDocuments = useCallback(async () => {
    try {
      const response = await fetch(`/api/agent/clients/${clientId}/documents`)
      if (!response.ok) throw new Error('Failed to fetch documents')
      const data = await response.json()
      setDocuments(data)
    } catch (error) {
      console.error('Failed to fetch documents:', error)
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-12">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        </div>
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-12 text-center">
        <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
        <p className="text-text-secondary">No documents found</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-blue-50/50 to-cyan-50/50 border-b border-border/50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Document Name
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Last Updated
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {documents.map((doc) => (
              <tr key={doc.document.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-text-secondary" />
                    <span className="font-medium text-text-primary">{doc.document.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {doc.docType ? (
                    <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-100 text-blue-700">
                      {doc.docType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  ) : (
                    <span className="text-text-muted text-sm">N/A</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-text-secondary">
                  {formatDate(doc.lastUpdated)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-2">
                    {doc.statusFlags.superseded && (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700">
                        Superseded
                      </span>
                    )}
                    {doc.statusFlags.signatureMissing && (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-100 text-red-700">
                        Signature Missing
                      </span>
                    )}
                    {!doc.statusFlags.superseded && !doc.statusFlags.signatureMissing && (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-green-100 text-green-700">
                        Active
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {doc.document.file_url ? (
                    <a
                      href={doc.document.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-accent hover:text-accent-dark"
                    >
                      View
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  ) : (
                    <span className="text-text-muted text-sm">No file</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

