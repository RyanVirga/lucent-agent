// Status mapping utilities for UI display
import type { DealStatus, DealSide } from '@/types/database'

/**
 * Maps database deal status to user-friendly label
 */
export function getDealStatusLabel(status: DealStatus): string {
  const labels: Record<DealStatus, string> = {
    draft: 'Draft',
    lead: 'Lead',
    searching: 'Searching',
    pre_approval: 'Pre-Approval',
    offer: 'Offer',
    pre_listing: 'Pre-Listing',
    active: 'Active',
    offer_review: 'Offer Review',
    under_contract: 'Under Contract',
    in_escrow: 'In Escrow',
    pending_contingencies: 'Pending Contingencies',
    pending: 'Pending',
    pending_coe: 'Pending COE',
    closed: 'Closed',
    cancelled: 'Cancelled',
  }
  return labels[status] || status
}

/**
 * Maps database deal side to user-friendly label
 */
export function getDealSideLabel(side: DealSide): string {
  const labels: Record<DealSide, string> = {
    buying: 'Buyer',
    listing: 'Seller',
    landlord: 'Landlord',
    tenant: 'Tenant',
    dual: 'Dual',
  }
  return labels[side] || side
}

/**
 * Returns Tailwind color classes for deal status pill
 */
export function getStatusColor(status: DealStatus): string {
  const colors: Record<DealStatus, string> = {
    draft: 'bg-gray-100 text-gray-700',
    lead: 'bg-blue-100 text-blue-700',
    searching: 'bg-purple-100 text-purple-700',
    pre_approval: 'bg-sky-100 text-sky-700',
    offer: 'bg-blue-100 text-blue-700',
    pre_listing: 'bg-teal-100 text-teal-700',
    active: 'bg-emerald-100 text-emerald-700',
    offer_review: 'bg-lime-100 text-lime-700',
    under_contract: 'bg-yellow-100 text-yellow-700',
    in_escrow: 'bg-cyan-100 text-cyan-700',
    pending_contingencies: 'bg-orange-100 text-orange-700',
    pending: 'bg-amber-100 text-amber-700',
    pending_coe: 'bg-indigo-100 text-indigo-700',
    closed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  }
  return colors[status] || 'bg-gray-100 text-gray-700'
}

/**
 * Returns Tailwind color classes for deal side badge
 */
export function getSideColor(side: DealSide): string {
  const colors: Record<DealSide, string> = {
    buying: 'bg-blue-100 text-blue-700',
    listing: 'bg-green-100 text-green-700',
    landlord: 'bg-purple-100 text-purple-700',
    tenant: 'bg-orange-100 text-orange-700',
    dual: 'bg-indigo-100 text-indigo-700',
  }
  return colors[side] || 'bg-gray-100 text-gray-700'
}

