'use client'

import { useState } from 'react'
import { ChevronDown, Mail, Phone, Globe, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import type { ClientDetail } from '@/types/clients'
import { getDealSideLabel, getSideColor, getDealStatusLabel, getStatusColor } from '@/lib/status-mapping'
import type { DealStatus } from '@/types/database'
import { Button } from '@/components/ui/Button'

interface ClientHeaderProps {
  clientDetail: ClientDetail
}

export function ClientHeader({ clientDetail }: ClientHeaderProps) {
  const { client, primaryDeal, property, portalInvites } = clientDetail
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const latestPortalInvite = portalInvites?.[0]

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const handleStatusChange = async (newStatus: DealStatus) => {
    if (!primaryDeal) return

    setUpdatingStatus(true)
    try {
      const response = await fetch(`/api/agent/deals/${primaryDeal.deal.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update status')
      }

      // Refresh page to show updated status
      window.location.reload()
    } catch (error) {
      console.error('Failed to update deal status:', error)
      alert('Failed to update deal status')
    } finally {
      setUpdatingStatus(false)
      setStatusDropdownOpen(false)
    }
  }

  const statusOptions: DealStatus[] = [
    'pre_approval',
    'offer',
    'pre_listing',
    'active',
    'offer_review',
    'lead',
    'searching',
    'under_contract',
    'in_escrow',
    'pending_contingencies',
    'pending',
    'closed',
    'cancelled',
  ]

  const getPortalInviteIcon = () => {
    if (!latestPortalInvite) return <AlertCircle className="w-4 h-4" />
    switch (latestPortalInvite.status) {
      case 'sent':
        return <CheckCircle2 className="w-4 h-4" />
      case 'accepted':
        return <CheckCircle2 className="w-4 h-4" />
      case 'pending':
        return <Clock className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  const getPortalInviteColor = () => {
    if (!latestPortalInvite) return 'bg-gray-100 text-gray-700'
    switch (latestPortalInvite.status) {
      case 'sent':
        return 'bg-blue-100 text-blue-700'
      case 'accepted':
        return 'bg-green-100 text-green-700'
      case 'pending':
        return 'bg-yellow-100 text-yellow-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getContactMethodIcon = () => {
    switch (client.preferred_contact_method) {
      case 'email':
        return <Mail className="w-4 h-4" />
      case 'text':
        return <Phone className="w-4 h-4" />
      case 'phone':
        return <Phone className="w-4 h-4" />
      default:
        return <Mail className="w-4 h-4" />
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-6 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xl">
            {getInitials(client.first_name, client.last_name)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary mb-2">
              {client.first_name} {client.last_name}
            </h1>
            {primaryDeal && (
              <div className="flex items-center gap-3 mb-3">
                <span className={`inline-block px-3 py-1 rounded-lg text-sm font-semibold ${getSideColor(primaryDeal.side)}`}>
                  {getDealSideLabel(primaryDeal.side)}
                </span>
                <div className="relative">
                  <button
                    onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                    disabled={updatingStatus}
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-semibold ${getStatusColor(primaryDeal.status)} ${updatingStatus ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}`}
                  >
                    {getDealStatusLabel(primaryDeal.status)}
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  {statusDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-border rounded-lg shadow-lg z-10 min-w-[200px]">
                      {statusOptions.map((status) => (
                        <button
                          key={status}
                          onClick={() => handleStatusChange(status)}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                            status === primaryDeal.status ? 'bg-blue-50 font-semibold' : ''
                          }`}
                        >
                          {getDealStatusLabel(status)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="space-y-2 mt-2">
              <div className="text-sm text-text-secondary">
                {property
                  ? `${property.street}${property.unit ? ` ${property.unit}` : ''}, ${property.city}, ${property.state} ${property.postal_code}`
                  : primaryDeal?.deal.property_address || 'No property address'}
              </div>
              <div className="flex items-center gap-4 text-sm">
                {client.email && (
                  <a href={`mailto:${client.email}`} className="text-accent hover:text-accent-dark flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {client.email}
                  </a>
                )}
                {client.phone && (
                  <a href={`tel:${client.phone}`} className="text-accent hover:text-accent-dark flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    {client.phone}
                  </a>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs">
                {client.preferred_contact_method && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-md">
                    {getContactMethodIcon()}
                    Prefers {client.preferred_contact_method}
                  </span>
                )}
                {client.preferred_language && client.preferred_language !== 'en' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-md">
                    <Globe className="w-4 h-4" />
                    {client.preferred_language === 'es' ? 'Spanish' : client.preferred_language}
                  </span>
                )}
                {latestPortalInvite && (
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md ${getPortalInviteColor()}`}>
                    {getPortalInviteIcon()}
                    Portal: {latestPortalInvite.status}
                  </span>
                )}
                {client.type && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 rounded-md capitalize">
                    {client.type}
                  </span>
                )}
              </div>
              {client.co_client_name && (
                <div className="text-sm text-text-secondary">
                  Co-client: <span className="font-medium text-text-primary">{client.co_client_name}</span>
                  {client.co_client_email && (
                    <span className="ml-2">
                      (<a href={`mailto:${client.co_client_email}`} className="text-accent hover:text-accent-dark">{client.co_client_email}</a>)
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {primaryDeal && (
        <div className="mt-6 pt-6 border-t border-border/50 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
              Price
            </div>
            <div className="text-lg font-bold text-text-primary">
              {formatCurrency(primaryDeal.deal.price)}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
              Loan Type
            </div>
            <div className="text-lg font-semibold text-text-primary">
              {primaryDeal.deal.loan_type || 'N/A'}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
              Down Payment
            </div>
            <div className="text-lg font-semibold text-text-primary">
              {primaryDeal.deal.down_payment_percent
                ? `${primaryDeal.deal.down_payment_percent}%`
                : 'N/A'}
            </div>
          </div>
          {primaryDeal.deal.target_date && (
            <div>
              <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                Target Date
              </div>
              <div className="text-lg font-semibold text-text-primary">
                {new Date(primaryDeal.deal.target_date).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {primaryDeal?.deal.mls_url && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <a 
            href={primaryDeal.deal.mls_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-accent hover:text-accent-dark flex items-center gap-2"
          >
            <Globe className="w-4 h-4" />
            View MLS Listing
          </a>
        </div>
      )}

      {client.notes && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
            Agent Notes
          </div>
          <div className="text-sm text-text-primary whitespace-pre-wrap">
            {client.notes}
          </div>
        </div>
      )}
    </div>
  )
}
