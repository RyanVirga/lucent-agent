// Auth helper for getting current profile and team
// Works with both server components and API routes
// 
// Note: In production, integrate with Supabase Auth middleware or @supabase/ssr
// For now, this assumes userId is available via cookies/headers or passed as parameter

import { cookies, headers } from 'next/headers'
import { supabaseAdmin } from '@/server/db/supabaseClient'
import type { Profile } from '@/types/database'

const devBypassAuth = process.env.DEV_BYPASS_AUTH === 'true'
const devBypassProfileId = process.env.DEV_BYPASS_PROFILE_ID || null
const isProduction = process.env.NODE_ENV === 'production'

const SCHEMA_MISSING_CODE = 'PGRST205'

const isSchemaMissingError = (error: unknown): boolean => {
  return Boolean(
    error &&
    typeof error === 'object' &&
    'code' in error &&
    (error as { code?: string }).code === SCHEMA_MISSING_CODE
  )
}

const buildDevStubProfile = (): Profile => {
  const now = new Date().toISOString()

  return {
    id: 'dev-profile',
    team_id: 'dev-team',
    email: 'dev@lucent-agent.local',
    first_name: 'Dev',
    last_name: 'Agent',
    role: 'developer',
    created_at: now,
    updated_at: now,
  }
}

export interface CurrentUser {
  profileId: string
  teamId: string
  profile: Profile
}

/**
 * Get current user's profile and team from Supabase auth
 * Works in server components and API routes
 * 
 * @param userId - Optional user ID. If not provided, attempts to get from auth context
 * @throws Error if user is not authenticated or profile not found
 */
export async function getCurrentProfileAndTeam(userId?: string): Promise<CurrentUser> {
  // In development we optionally bypass auth by pinning a known profile.
  if (devBypassAuth) {
    if (!devBypassProfileId) {
      throw new Error('DEV_BYPASS_PROFILE_ID must be set when DEV_BYPASS_AUTH=true')
    }

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', devBypassProfileId)
      .single()

    if (error || !profile) {
      if (!isProduction) {
        console.warn('Dev bypass profile lookup failed', error)
      }

      if (!isProduction && error && isSchemaMissingError(error)) {
        const stubProfile = buildDevStubProfile()
        console.warn('Supabase schema missing; using in-memory dev profile')
        return {
          profileId: stubProfile.id,
          teamId: stubProfile.team_id,
          profile: stubProfile,
        }
      }

      throw new Error(`Bypass profile ${devBypassProfileId} not found`)
    }

    if (!isProduction) {
      console.warn('Auth bypass enabled - using DEV_BYPASS_PROFILE_ID')
    }

    return {
      profileId: profile.id,
      teamId: profile.team_id,
      profile,
    }
  }

  let profileId: string | null = userId || null

  // If userId not provided, try to get from auth context
  // In production, this would be handled by Supabase Auth middleware
  if (!profileId) {
    try {
      const cookieStore = await cookies()
      const headersList = await headers()
      
      // Try to get user ID from cookies (set by Supabase Auth)
      // Common cookie names: sb-<project-ref>-auth-token, or custom
      const authCookie = cookieStore.get('sb-auth-token')?.value ||
                        cookieStore.get('supabase-auth-token')?.value
      
      if (authCookie) {
        // Parse JWT token to get user ID (simplified - in production use proper JWT parsing)
        // For now, assume the cookie contains user info or we get it another way
        // This is a placeholder - replace with actual Supabase auth integration
      }
      
      // Alternative: Get from Authorization header
      const authHeader = headersList.get('authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '')
        // In production, verify token and extract user ID
        // For now, this is a placeholder
      }
    } catch (error) {
      // If we can't get from context, that's okay - userId parameter can be used
    }
  }

  if (!profileId) {
    // During early development fall back to the earliest profile so the UI remains usable.
    if (!isProduction) {
      const { data: fallbackProfile, error: fallbackError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (fallbackProfile) {
        console.warn('Dev fallback profile in use - configure auth for real users')
        return {
          profileId: fallbackProfile.id,
          teamId: fallbackProfile.team_id,
          profile: fallbackProfile,
        }
      }

      if (fallbackError) {
        console.warn('Dev fallback profile lookup failed', fallbackError)

        if (isSchemaMissingError(fallbackError)) {
          const stubProfile = buildDevStubProfile()
          console.warn('Supabase schema missing; using in-memory dev profile')
          return {
            profileId: stubProfile.id,
            teamId: stubProfile.team_id,
            profile: stubProfile,
          }
        }
      }
    }

    throw new Error('Not authenticated: user ID not found')
  }

  // Get profile with team_id
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', profileId)
    .single()

  if (profileError || !profile) {
    throw new Error(`Profile not found for user ${profileId}`)
  }

  return {
    profileId: profile.id,
    teamId: profile.team_id,
    profile,
  }
}

/**
 * Simplified version that just returns profileId and teamId
 * Use this when you don't need the full profile object
 */
export async function getCurrentAgentContext(userId?: string): Promise<{ profileId: string; teamId: string }> {
  const { profileId, teamId } = await getCurrentProfileAndTeam(userId)
  return { profileId, teamId }
}

