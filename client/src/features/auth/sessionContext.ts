import { createContext, useContext } from 'react'
import type { Session } from '@supabase/supabase-js'

export const SessionContext = createContext<{ session: Session | null; loading: boolean }>({ session: null, loading: true })
export const useSession = () => useContext(SessionContext)
