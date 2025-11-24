'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, X, ChevronDown, Check, Filter } from 'lucide-react'
import type { DealStatus, DealSide } from '@/types/database'

interface FilterOption {
  value: string
  label: string
}

interface FilterDropdownProps {
  label: string
  options: FilterOption[]
  selectedValues: string[]
  onToggle: (value: string) => void
}

function FilterDropdown({ label, options, selectedValues, onToggle }: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${
          selectedValues.length > 0
            ? 'bg-accent/5 border-accent text-accent font-medium'
            : 'bg-white border-border text-text-secondary hover:border-gray-300'
        }`}
      >
        <span className="text-sm">{label}</span>
        {selectedValues.length > 0 && (
          <span className="bg-accent text-white text-xs px-1.5 py-0.5 rounded-full font-bold min-w-[20px] text-center">
            {selectedValues.length}
          </span>
        )}
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-border/50 p-2 z-50">
          <div className="max-h-64 overflow-y-auto space-y-0.5 scrollbar-thin scrollbar-thumb-gray-200">
            {options.map((option) => {
              const isSelected = selectedValues.includes(option.value)
              return (
                <button
                  key={option.value}
                  onClick={() => onToggle(option.value)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
                    isSelected ? 'bg-accent/5 text-accent font-medium' : 'text-text-primary hover:bg-gray-50'
                  }`}
                >
                  <span>{option.label}</span>
                  {isSelected && <Check className="w-4 h-4" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export function ClientsFilterBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [selectedStatuses, setSelectedStatuses] = useState<DealStatus[]>(
    searchParams.get('status')?.split(',') as DealStatus[] || []
  )
  const [selectedSides, setSelectedSides] = useState<DealSide[]>(
    searchParams.get('side')?.split(',') as DealSide[] || []
  )
  const [closingThisWeek, setClosingThisWeek] = useState(
    searchParams.get('closingThisWeek') === 'true'
  )
  const [closingThisMonth, setClosingThisMonth] = useState(
    searchParams.get('closingThisMonth') === 'true'
  )

  const statusOptions: DealStatus[] = [
    'lead',
    'searching',
    'under_contract',
    'in_escrow',
    'pending_contingencies',
    'pending',
    'closed',
    'cancelled',
  ]

  const sideOptions: DealSide[] = ['buying', 'listing', 'landlord', 'tenant', 'dual']

  const updateURL = useCallback(() => {
    const params = new URLSearchParams()
    
    if (search) params.set('search', search)
    if (selectedStatuses.length > 0) params.set('status', selectedStatuses.join(','))
    if (selectedSides.length > 0) params.set('side', selectedSides.join(','))
    if (closingThisWeek) params.set('closingThisWeek', 'true')
    if (closingThisMonth) params.set('closingThisMonth', 'true')

    router.push(`/clients?${params.toString()}`)
  }, [search, selectedStatuses, selectedSides, closingThisWeek, closingThisMonth, router])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateURL()
    }, 300) // Debounce search

    return () => clearTimeout(timeoutId)
  }, [updateURL])

  const toggleStatus = (status: string) => {
    const s = status as DealStatus
    setSelectedStatuses(prev =>
      prev.includes(s) ? prev.filter(item => item !== s) : [...prev, s]
    )
  }

  const toggleSide = (side: string) => {
    const s = side as DealSide
    setSelectedSides(prev =>
      prev.includes(s) ? prev.filter(item => item !== s) : [...prev, s]
    )
  }

  const clearFilters = () => {
    setSearch('')
    setSelectedStatuses([])
    setSelectedSides([])
    setClosingThisWeek(false)
    setClosingThisMonth(false)
    router.push('/clients')
  }

  const hasActiveFilters = search || selectedStatuses.length > 0 || selectedSides.length > 0 || closingThisWeek || closingThisMonth

  const statusDropdownOptions = statusOptions.map(status => ({
    value: status,
    label: status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }))

  const sideDropdownOptions = sideOptions.map(side => {
    const labels: Record<DealSide, string> = {
      buying: 'Buyer',
      listing: 'Seller',
      landlord: 'Landlord',
      tenant: 'Tenant',
      dual: 'Dual',
    }
    return {
      value: side,
      label: labels[side]
    }
  })

  return (
    <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-4 mb-6">
      <div className="flex flex-col gap-4">
        {/* Top Row: Search and Dropdowns */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
            <input
              type="text"
              placeholder="Search clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-text-primary bg-background-surface placeholder:text-text-muted"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <FilterDropdown 
              label="Status" 
              options={statusDropdownOptions} 
              selectedValues={selectedStatuses} 
              onToggle={toggleStatus} 
            />
            <FilterDropdown 
              label="Side" 
              options={sideDropdownOptions} 
              selectedValues={selectedSides} 
              onToggle={toggleSide} 
            />
          </div>
        </div>

        {/* Bottom Row: Quick Filters and Active Chips */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/30">
          <div className="flex items-center gap-2 text-sm text-text-secondary mr-2">
            <Filter className="w-4 h-4" />
            <span className="font-medium">Quick Filters:</span>
          </div>
          
          <button
            onClick={() => setClosingThisWeek(!closingThisWeek)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
              closingThisWeek
                ? 'bg-orange-50 border-orange-200 text-orange-700'
                : 'bg-transparent border-border text-text-secondary hover:border-gray-300'
            }`}
          >
            Closing This Week
          </button>
          
          <button
            onClick={() => setClosingThisMonth(!closingThisMonth)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
              closingThisMonth
                ? 'bg-orange-50 border-orange-200 text-orange-700'
                : 'bg-transparent border-border text-text-secondary hover:border-gray-300'
            }`}
          >
            Closing This Month
          </button>

          {hasActiveFilters && (
            <div className="flex items-center gap-2 ml-auto">
              <div className="h-4 w-px bg-border mx-2 hidden md:block"></div>
              <button
                onClick={clearFilters}
                className="text-sm text-text-muted hover:text-red-600 transition-colors flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Clear
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
