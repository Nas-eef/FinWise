import { createClient } from '@supabase/supabase-js'

const env =
  typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env
    : typeof process !== 'undefined' && process.env
    ? process.env
    : {}

const supabaseUrl = env.VITE_SUPABASE_URL || 'https://roviyryoafpsftedpsye.supabase.co'
const supabasePublishableKey =
  env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_rtzca4YXTYE6lhPd6x1AjA_t0zdWeDv'

if (!supabaseUrl || !supabasePublishableKey) {
  console.error('Missing Supabase configuration environment variables.')
}

/**
 * Centralized, singleton Supabase client for FinWise.
 * Authenticated queries automatically attach verified JWT tokens in headers.
 * Row Level Security (RLS) is strictly enforced using auth.uid().
 */
export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'finwise_supabase_auth_session',
  },
})

/**
 * Standardized Supabase response formatter & error handler
 */
export const handleSupabaseError = (error, defaultMessage = 'An unexpected error occurred') => {
  if (!error) return null
  console.error('Supabase Operation Error:', error)
  return {
    message: error.message || defaultMessage,
    code: error.code || 'DATABASE_ERROR',
    details: error.details || null,
  }
}

export default supabase
