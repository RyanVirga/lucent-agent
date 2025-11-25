import { createClient } from '@supabase/supabase-js'

// Default to placeholders during build if env vars are missing
// This prevents build crashes, but will fail at runtime if not configured
const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'placeholder'
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'placeholder'

const isConfigured = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY

if (!isConfigured && process.env.NODE_ENV === 'production') {
  console.warn('Supabase environment variables missing in production build')
}

// Server-side Supabase client with service role key
// This bypasses RLS and should only be used in server-side code
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Client-side Supabase client (for future use)
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)


