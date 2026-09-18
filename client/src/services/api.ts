import type { HealthResponse } from '../types/api'

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

// Future protected requests must send the Supabase session's access token as
// Authorization: Bearer <access_token>. FastAPI must validate it server-side.

