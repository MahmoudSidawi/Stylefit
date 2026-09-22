import type { HealthResponse } from '../types/api'
import { getSupabaseClient } from './supabase'

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
  const headers = new Headers(options.headers)
  if (authenticated) {
    const { data, error } = await getSupabaseClient().auth.getSession()
    if (error) throw error
    if (!data.session) throw new Error('Sign in to continue.')
    headers.set('Authorization', `Bearer ${data.session.access_token}`)
  }
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json')
  const response = await fetch(`${apiBaseUrl}${path}`, { ...options, headers })
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null)
    const detail = body && typeof body === 'object' && 'detail' in body ? body.detail : null
    throw new Error(typeof detail === 'string' ? detail : `Request failed (${response.status}). Check your details and retry.`)
  }
  return response.status === 204 ? undefined as T : await response.json() as T
}
