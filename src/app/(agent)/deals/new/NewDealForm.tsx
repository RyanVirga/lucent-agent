'use client'

import { useActionState, useState } from 'react'
import { createDeal } from './actions'
import { ArrowLeft, Building2, Calendar, DollarSign, FileText, CheckCircle2, User, Home, ArrowUpRight, ArrowDownLeft, Check } from 'lucide-react'
import Link from 'next/link'
import type { Client } from '@/types/database'

interface NewDealFormProps {
  clients: Client[]
}

export function NewDealForm({ clients }: NewDealFormProps) {
  const [state, action, isPending] = useActionState(createDeal, {})
  const [dealSide, setDealSide] = useState<'buying' | 'listing'>('buying')
  
  return (
    <form action={action} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Error Display */}
      {state.message && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
          {state.message}
        </div>
      )}

      {/* Section 1: Client Selection */}
      <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-8 transition-all hover:shadow-md">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-accent">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Client Selection</h2>
              <p className="text-sm text-text-secondary">Who is this deal for?</p>
            </div>
          </div>
          <Link 
            href="/clients/new" 
            className="text-sm px-4 py-2 bg-gray-50 text-text-primary rounded-lg font-medium hover:bg-gray-100 transition-colors border border-border/50"
          >
            + Create New Client
          </Link>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-text-secondary uppercase tracking-wider text-xs">Select Client</label>
          <div className="relative group">
            <select
              name="clientId"
              required
              defaultValue=""
              className="w-full pl-4 pr-10 py-3 rounded-xl border border-border focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all appearance-none bg-white cursor-pointer hover:border-accent/50"
            >
              <option value="" disabled>Select an existing client...</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.first_name} {client.last_name} — {client.email}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary group-hover:text-accent transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          {state.errors?.clientId && (
            <p className="text-red-600 text-sm flex items-center gap-1 mt-2">
              <span className="w-1 h-1 rounded-full bg-red-600" />
              {state.errors.clientId[0]}
            </p>
          )}
        </div>
      </div>

      {/* Section 2: Deal Type */}
      <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-8 transition-all hover:shadow-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Deal Type</h2>
            <p className="text-sm text-text-secondary">Are you representing the buyer or seller?</p>
          </div>
        </div>

        <div className="flex gap-4">
          <label 
            className={`
              flex-1 relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 ease-in-out group flex items-center justify-center gap-3
              ${dealSide === 'buying' 
                ? 'border-accent bg-accent/5 ring-2 ring-accent/10' 
                : 'border-border/50 hover:border-accent/30 hover:bg-gray-50'}
            `}
          >
            <input 
              type="radio" 
              name="side" 
              value="buying" 
              checked={dealSide === 'buying'}
              onChange={() => setDealSide('buying')}
              className="sr-only" 
            />
            <div className={`
              p-2 rounded-lg transition-colors duration-200
              ${dealSide === 'buying' ? 'bg-accent text-white shadow-sm' : 'bg-gray-100 text-gray-500 group-hover:bg-white group-hover:text-accent'}
            `}>
              <ArrowDownLeft className="w-5 h-5" />
            </div>
            <span className={`font-bold transition-colors ${dealSide === 'buying' ? 'text-accent' : 'text-text-primary'}`}>
              Buying Side
            </span>
            {dealSide === 'buying' && (
               <div className="absolute top-2 right-2 text-accent animate-in zoom-in duration-200">
                 <CheckCircle2 className="w-4 h-4" />
               </div>
            )}
          </label>

          <label 
            className={`
              flex-1 relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 ease-in-out group flex items-center justify-center gap-3
              ${dealSide === 'listing' 
                ? 'border-accent bg-accent/5 ring-2 ring-accent/10' 
                : 'border-border/50 hover:border-accent/30 hover:bg-gray-50'}
            `}
          >
            <input 
              type="radio" 
              name="side" 
              value="listing" 
              checked={dealSide === 'listing'}
              onChange={() => setDealSide('listing')}
              className="sr-only" 
            />
             <div className={`
              p-2 rounded-lg transition-colors duration-200
              ${dealSide === 'listing' ? 'bg-accent text-white shadow-sm' : 'bg-gray-100 text-gray-500 group-hover:bg-white group-hover:text-accent'}
            `}>
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <span className={`font-bold transition-colors ${dealSide === 'listing' ? 'text-accent' : 'text-text-primary'}`}>
              Listing Side
            </span>
            {dealSide === 'listing' && (
               <div className="absolute top-2 right-2 text-accent animate-in zoom-in duration-200">
                 <CheckCircle2 className="w-4 h-4" />
               </div>
            )}
          </label>
        </div>
      </div>

      {/* Section 3: Property & Financials */}
      <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-8 transition-all hover:shadow-md">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Home className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Property Details</h2>
            <p className="text-sm text-text-secondary">Address and target financials</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary uppercase tracking-wider text-xs">Property Address *</label>
            <input 
              name="propertyAddress"
              required 
              className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all placeholder:text-gray-400"
              placeholder="e.g. 123 Main St, San Francisco, CA 94105"
            />
            {state.errors?.propertyAddress && (
              <p className="text-red-600 text-sm flex items-center gap-1 mt-2">
                <span className="w-1 h-1 rounded-full bg-red-600" />
                {state.errors.propertyAddress[0]}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary uppercase tracking-wider text-xs">Price Estimate</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-accent transition-colors">
                  <DollarSign className="w-5 h-5" />
                </div>
                <input 
                  name="price"
                  type="number"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary uppercase tracking-wider text-xs">Target Closing Date</label>
              <div className="relative group">
                 <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-accent transition-colors">
                  <Calendar className="w-5 h-5" />
                </div>
                <input 
                  name="targetDate"
                  type="date"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all"
                />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Section 4: Notes */}
      <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-8 transition-all hover:shadow-md">
        <div className="space-y-2">
          <label className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
              <FileText className="w-5 h-5" />
            </div>
            Internal Notes
          </label>
          <textarea 
            name="notes"
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all resize-none placeholder:text-gray-400"
            placeholder="Add any context, preferences, or immediate tasks needed for this deal..."
          />
        </div>
      </div>

      {/* Footer Action */}
      <div className="sticky bottom-4 z-10 flex items-center justify-end gap-4 pt-4 pb-4">
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm -z-10 rounded-2xl shadow-lg border border-white/20" />
        <Link 
          href="/dashboard"
          className="px-6 py-3 text-text-secondary hover:bg-gray-100/80 rounded-xl font-medium transition-colors"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="px-10 py-3 bg-accent hover:bg-accent-dark text-white rounded-xl font-medium shadow-xl shadow-accent/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transform active:scale-95"
        >
          {isPending ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Creating Deal...
            </>
          ) : (
            'Create Deal'
          )}
        </button>
      </div>
    </form>
  )
}
