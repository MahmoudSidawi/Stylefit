import { shopApi } from '../../../services/shopApi'

type Photo = { url: string; expiresAt: number; error?: boolean }
const cache = new Map<string, Photo>()
const pending = new Map<string, Promise<Photo>>()
let generation = 0

export function clearWardrobePhotos() {
  generation++
  cache.clear()
  pending.clear()
}

export function cachedWardrobePhoto(key: string) {
  const entry = cache.get(key)
  return entry && entry.expiresAt > Date.now() ? entry : undefined
}

export function loadWardrobePhoto(key: string, itemId: string) {
  const cached = cachedWardrobePhoto(key)
  if (cached) return Promise.resolve(cached)
  const existing = pending.get(key)
  if (existing) return existing
  const started = generation
  const request = shopApi.wardrobeImage(itemId).then((photo) => {
    const entry = { url: photo.url, expiresAt: Date.now() + Math.max(0, photo.expires_in - 30) * 1000 }
    if (generation === started) cache.set(key, entry)
    return entry
  }).finally(() => { if (pending.get(key) === request) pending.delete(key) })
  pending.set(key, request)
  return request
}
