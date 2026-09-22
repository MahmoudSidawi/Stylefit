import { useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { getSupabaseClient, getAdminClient, isSupabaseConfigured } from '../../services/supabase'
import { SessionContext } from './sessionContext'

export function SessionProvider({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured())
  useEffect(() => {
    if (!isSupabaseConfigured()) return
    const client = admin ? getAdminClient() : getSupabaseClient()
    const { data } = client.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      setLoading(false)
    })
    return () => data.subscription.unsubscribe()
  }, [admin])
  return <SessionContext.Provider value={{ session, loading }}>{children}</SessionContext.Provider>
}
