import { useState } from 'react'
import { shopApi, type Profile } from '../../services/shopApi'
import { useRemote } from '../live/hooks'

// Short-lived, account-scoped Supabase response cache. Never persisted to disk.
const profiles = new Map<string, { data?: Profile; expires: number; pending?: Promise<Profile> }>()
const freshnessMs = 30_000

export function clearAccountProfiles() { profiles.clear() }

export function storeAccountProfile(profile: Profile) {
  profiles.set(profile.user_id, { data: profile, expires: Date.now() + freshnessMs })
}

function loadProfile(userId: string): Promise<Profile> {
  const existing = profiles.get(userId)
  if (existing?.pending) return existing.pending
  if (existing?.data && existing.expires > Date.now()) return Promise.resolve(existing.data)
  const entry: { data?: Profile; expires: number; pending?: Promise<Profile> } = { expires: 0 }
  profiles.set(userId, entry)
  entry.pending = shopApi.me().then((data) => {
    if (data.user_id !== userId) throw new Error('Your account changed. Please reload your profile.')
    if (profiles.get(userId) === entry) storeAccountProfile(data)
    return data
  }).catch((error: unknown) => {
    if (profiles.get(userId) === entry) profiles.delete(userId)
    throw error
  })
  return entry.pending
}

export function useAccountProfile(userId?: string, enabled = true) {
  const [initial] = useState(() => {
    const cached = userId ? profiles.get(userId) : undefined
    return enabled && cached && cached.expires > Date.now() ? cached.data : undefined
  })
  const remote = useRemote(() => loadProfile(userId!), 'profile:' + userId, !!userId && enabled)
  const data = remote.data ?? (enabled && initial?.user_id === userId ? initial : undefined)
  return { ...remote, data, loading: remote.loading && !data,
    reload: () => { if (userId) profiles.delete(userId); remote.reload() } }
}
