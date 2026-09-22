import type { HealthResponse } from '../types/api'
import { getSupabaseClient, getAdminClient } from './supabase'

const apiBaseUrl = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
).replace(/\/+$/, '')

export async function getHealth(signal?: AbortSignal): Promise<HealthResponse> {
  const response = await fetch(`${apiBaseUrl}/health`, { signal })

  if (!response.ok) {
    throw new Error(`Health request failed (HTTP ${response.status}).`)
  }

  const data: unknown = await response.json()
  if (typeof data !== 'object' || data === null ||
      !('status' in data) || data.status !== 'ok') {
    throw new Error('The server returned an unexpected health response.')
  }

  return { status: data.status }
}

export async function apiRequest<T>(path: string, options: RequestInit = {}, authenticated = true): Promise<T> {
  const controller = new AbortController()
  const signal = options.signal ? AbortSignal.any([options.signal, controller.signal]) : controller.signal
  // Give AI inference longer; list requests should fail visibly instead of hanging.
  const timeoutMs = path === '/api/matches' || path.endsWith('/analyze') ? 90000 : 20000
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      reject(new Error(options.method && options.method !== 'GET'
        ? 'The request took too long. Check whether your change was saved before trying again.'
        : 'The server is taking too long. Please try again.'))
      controller.abort()
    }, timeoutMs)
  })
  async function send(): Promise<T> {
    const headers = new Headers(options.headers)
    if (authenticated) {
      const { data, error } = await (path.startsWith('/api/admin/') ? getAdminClient() : getSupabaseClient()).auth.getSession()
      if (error) throw error
      if (!data.session) throw new Error('Sign in to continue.')
      headers.set('Authorization', `Bearer ${data.session.access_token}`)
    }
    signal.throwIfAborted()
    if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json')
    const response = await fetch(`${apiBaseUrl}${path}`, { ...options, headers, signal })
    if (!response.ok) {
      const body: unknown = await response.json().catch(() => null)
      const detail = body && typeof body === 'object' && 'detail' in body ? body.detail : null
      throw new Error(typeof detail === 'string' ? detail : `Request failed (${response.status}). Check your details and retry.`)
    }
    return response.status === 204 ? undefined as T : await response.json() as T
  }
  try {
    return await Promise.race([send(), timeout])
  } finally {
    clearTimeout(timer)
  }
}
