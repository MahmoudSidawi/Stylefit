import { useEffect, useRef, useState } from 'react'

export function refreshShop() { window.dispatchEvent(new Event('stylefit:changed')) }
export function useRemote<T>(loader: () => Promise<T>, key: string, enabled = true) {
  const latest = useRef(loader)
  useEffect(() => { latest.current = loader })
  const [version, setVersion] = useState(0)
  const requestKey = `${key}:${enabled}:${version}`
  const [state, setState] = useState<{ data?: T; error: string; requestKey: string; sourceKey: string }>({ error: '', requestKey: '', sourceKey: '' })
  useEffect(() => {
    const refresh = () => setVersion((v) => v + 1)
    window.addEventListener('stylefit:changed', refresh)
    return () => window.removeEventListener('stylefit:changed', refresh)
  }, [])
  useEffect(() => {
    let active = true
    if (enabled) latest.current().then((data) => {
      if (active) setState({ data, error: '', requestKey, sourceKey: key })
    }).catch((error: unknown) => {
      if (active) setState((previous) => ({ data: previous.sourceKey === key ? previous.data : undefined,
        error: error instanceof Error ? error.message : 'Unable to load this page.', requestKey, sourceKey: key }))
    })
    return () => { active = false }
  }, [requestKey, enabled, key])
  const current = enabled && state.sourceKey === key ? state : { data: undefined, error: '' }
  return { ...current, loading: enabled && state.requestKey !== requestKey, reload: () => setVersion((v) => v + 1) }
}

export function useAction() {
  const running = useRef(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  async function run(action: () => Promise<unknown>, success = '') {
    if (running.current) return false
    running.current = true
    setBusy(true); setError(''); setMessage('')
    try {
      await action()
      setMessage(success)
      refreshShop()
      return true
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Something went wrong. Please retry.')
      return false
    } finally { running.current = false; setBusy(false) }
  }
  return { busy, error, message, run }
}

