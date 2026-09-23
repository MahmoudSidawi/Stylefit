import { useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { getSupabaseClient, getAdminClient, isSupabaseConfigured } from '../../services/supabase'
import { SessionContext } from './sessionContext'
import { clearAccountProfiles } from './useAccountProfile'

export function SessionProvider({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured())
  useEffect(() => {
    if (!isSupabaseConfigured()) return
    const client = admin ? getAdminClient() : getSupabaseClient()
    let previousUser: string | undefined
    const { data } = client.auth.onAuthStateChange((event, next) => {
      if (!admin && (event === 'SIGNED_OUT' || (previousUser && previousUser !== next?.user.id))) clearAccountProfiles()
      previousUser = next?.user.id
      setSession(next)
      setLoading(false)
    })
    return () => data.subscription.unsubscribe()
  }, [admin])
  return <SessionContext.Provider value={{ session, loading }}>{children}</SessionContext.Provider>
}
