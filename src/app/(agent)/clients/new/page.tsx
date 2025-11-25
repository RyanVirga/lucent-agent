'use client'

import { useActionState, useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { createClient } from './actions'
import { ArrowLeft, User, Home, Briefcase, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ButtonLink } from '@/components/ui/ButtonLink'

export default function NewClientPage() {
  const [state, action, isPending] = useActionState(createClient, {})
  const [clientType, setClientType] = useState('buyer')
  const [addProperty, setAddProperty] = useState(false)

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto pb-20">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <ButtonLink 
            href="/clients" 
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </ButtonLink>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Add New Client</h1>
            <p className="text-sm text-text-secondary mt-1">Create a client profile and start a transaction workflow.</p>
          </div>
        </div>

        <form action={action} className="space-y-6">
          
          {/* Error Display */}
          {state.message && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {state.message}
            </div>
          )}

          {/* Card 1: Client Type */}
          <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-accent">
                <Briefcase className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-semibold text-text-primary">Transaction Type</h2>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {(['buyer', 'seller', 'both'] as const).map((type) => (
                <label 
                  key={type}
                  className={`
                    relative flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all
                    ${clientType === type 
                      ? 'border-accent bg-blue-50/50 text-accent' 
                      : 'border-border/50 hover:border-border hover:bg-gray-50 text-text-secondary'}
                  `}
                >
                  <input 
                    type="radio" 
                    name="type" 
                    value={type} 
                    checked={clientType === type}
                    onChange={(e) => setClientType(e.target.value)}
                    className="sr-only" 
                  />
                  <span className="capitalize font-semibold">{type}</span>
                  {clientType === type && (
                    <div className="absolute top-2 right-2 text-accent">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  )}
                </label>
              ))}
            </div>
            {state.errors?.type && (
              <p className="text-red-600 text-sm mt-2">{state.errors.type[0]}</p>
            )}
          </div>

          {/* Card 2: Client Info */}
          <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-accent">
                <User className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-semibold text-text-primary">Client Details</h2>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">First Name *</label>
                <input 
                  name="firstName"
                  required 
                  className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all"
                  placeholder="Jane"
                />
                {state.errors?.firstName && (
                  <p className="text-red-600 text-sm">{state.errors.firstName[0]}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">Last Name *</label>
                <input 
                  name="lastName"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all"
                  placeholder="Doe"
                />
                {state.errors?.lastName && (
                  <p className="text-red-600 text-sm">{state.errors.lastName[0]}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">Email *</label>
                <input 
                  name="email"
                  type="email"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all"
                  placeholder="jane@example.com"
                />
                {state.errors?.email && (
                  <p className="text-red-600 text-sm">{state.errors.email[0]}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">Phone *</label>
                <input 
                  name="phone"
                  type="tel"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all"
                  placeholder="(555) 123-4567"
                />
                {state.errors?.phone && (
                  <p className="text-red-600 text-sm">{state.errors.phone[0]}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">Preferred Contact</label>
                <select 
                  name="preferredContactMethod"
                  className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all bg-white"
                >
                  <option value="email">Email</option>
                  <option value="text">Text Message</option>
                  <option value="phone">Phone Call</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">Language</label>
                <select 
                  name="preferredLanguage"
                  className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all bg-white"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                </select>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-border/50">
              <h3 className="text-sm font-medium text-text-primary mb-4">Co-Client (Optional)</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary">Name</label>
                  <input 
                    name="coClientName"
                    className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all"
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary">Email</label>
                  <input 
                    name="coClientEmail"
                    type="email"
                    className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all"
                    placeholder="john@example.com"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Property */}
          <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-accent">
                  <Home className="w-4 h-4" />
                </div>
                <h2 className="text-lg font-semibold text-text-primary">Property Details</h2>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-text-secondary">Add property now</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    name="addProperty" 
                    className="sr-only peer" 
                    checked={addProperty}
                    onChange={(e) => setAddProperty(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                </label>
              </div>
            </div>

            {addProperty && (
              <div className="grid grid-cols-1 gap-6 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary">Address</label>
                  <input 
                    name="propertyAddress"
                    className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all"
                    placeholder="123 Main St, City, State"
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary">Target Price</label>
                    <input 
                      name="price"
                      type="number"
                      className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all"
                      placeholder="500000"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary">Target Date</label>
                    <input 
                      name="targetDate"
                      type="date"
                      className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary">MLS URL (Optional)</label>
                  <input 
                    name="mlsUrl"
                    type="url"
                    className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all"
                    placeholder="https://..."
                  />
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-6">
            <div className="space-y-2">
              <label className="text-lg font-semibold text-text-primary block mb-4">Internal Notes</label>
              <textarea 
                name="notes"
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all resize-none"
                placeholder="Add any initial notes about this client..."
              />
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-4 pt-4">
            <ButtonLink 
              href="/clients"
              variant="secondary"
              className="px-6 py-2.5 text-text-secondary hover:bg-gray-100 rounded-xl font-medium transition-colors"
            >
              Cancel
            </ButtonLink>
            <Button
              type="submit"
              disabled={isPending}
              isLoading={isPending}
              size="lg"
              className="px-8 shadow-lg shadow-accent/20"
            >
              Create Client & Start Workflow
            </Button>
          </div>

        </form>
      </div>
    </AppShell>
  )
}
