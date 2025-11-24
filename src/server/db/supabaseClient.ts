import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
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
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)

