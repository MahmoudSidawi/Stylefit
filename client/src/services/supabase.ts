import { createClient } from '@supabase/supabase-js'

let supabase: ReturnType<typeof createClient> | undefined

// Initialize on first use so placeholder pages run without credentials.
// Add generated Database types after the approved ERD migrations exist.
export function getSupabaseClient() {
  if (supabase) return supabase

  const url = import.meta.env.VITE_SUPABASE_URL
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

  if (!url || !publishableKey ||
      url.includes('your-project') ||
      publishableKey === 'your-supabase-publishable-key') {
    throw new Error('Set the public Supabase values in client/.env before using Supabase.')
  }

  supabase = createClient(url, publishableKey)
  return supabase
}

