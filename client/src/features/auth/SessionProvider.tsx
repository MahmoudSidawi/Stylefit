import { useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { getSupabaseClient, isSupabaseConfigured } from '../../services/supabase'
import { SessionContext } from './sessionContext'

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured())
  useEffect(() => {
    if (!isSupabaseConfigured()) return
    const client = getSupabaseClient()
    const { data } = client.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      setLoading(false)
    })
    return () => data.subscription.unsubscribe()
  }, [])
  return <SessionContext.Provider value={{ session, loading }}>{children}</SessionContext.Provider>
}
