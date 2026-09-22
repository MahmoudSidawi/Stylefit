import { createClient } from '@supabase/supabase-js'

let supabase: ReturnType<typeof createClient> | undefined

export function isSupabaseConfigured() {
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  return Boolean(url && key && !url.includes('your-project') && key !== 'your-supabase-publishable-key')
}

// Initialize on first use so placeholder pages run without credentials.
// Add generated Database types after the approved ERD migrations exist.
export function getSupabaseClient() {
  if (supabase) return supabase

  const url = import.meta.env.VITE_SUPABASE_URL
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

  if (!url || !publishableKey ||
      url.includes('your-project') ||
      publishableKey === 'your-supabase-publishable-key') {
    throw new Error('Account services are not configured yet. Please try again after store setup.')
  }

  supabase = createClient(url, publishableKey)
  return supabase
}
