import { sampleWardrobe } from './sampleWardrobe'
import { isColor, isKind } from './options'
import type { WardrobeItem, WardrobeDraft } from '../types'

const storageKey = 'stylefit:wardrobe:v1'
type Snapshot = { items: WardrobeItem[]; error: string }
let snapshot: Snapshot | undefined
const listeners = new Set<() => void>()
const validText = (value: unknown, max: number): value is string =>
  typeof value === 'string' && value.trim().length > 0 && value.length <= max

function isItem(value: unknown): value is WardrobeItem {
  if (!value || typeof value !== 'object') return false
  if (
    !('id' in value) ||
    typeof value.id !== 'string' ||
    !/^closet-[\w-]{1,80}$/.test(value.id)
  )
    return false
  if (
    !('name' in value) ||
    !validText(value.name, 70) ||
    !('material' in value) ||
    !validText(value.material, 70) ||
    !('size' in value) ||
    !validText(value.size, 20)
  )
    return false
  if (
    !('kind' in value) ||
    typeof value.kind !== 'string' ||
    !isKind(value.kind) ||
    !('color' in value) ||
    typeof value.color !== 'string' ||
    !isColor(value.color)
  )
    return false
  if (
    !('sample' in value) ||
    typeof value.sample !== 'boolean' ||
    !('addedAt' in value) ||
    typeof value.addedAt !== 'number' ||
    !Number.isFinite(value.addedAt)
  )
    return false
  if (!('image' in value) || typeof value.image !== 'string') return false
  return (
    sampleWardrobe.some((item) => item.image === value.image) ||
    (value.image.length < 2_800_000 &&
      /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(value.image))
  )
}

function read(): Snapshot {
  try {
    const raw = localStorage.getItem(storageKey)
    if (raw === null) return { items: sampleWardrobe, error: '' }
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) throw new Error('Invalid saved wardrobe')
    const ids = new Set<string>()
    const items = parsed
      .filter(isItem)
      .filter((item) => {
        if (ids.has(item.id)) return false
        ids.add(item.id)
        return true
      })
      .slice(0, 60)
    return {
      items,
      error:
        items.length !== parsed.length
          ? 'Some saved items could not be read. Valid items are still available.'
          : '',
    }
  } catch {
    return {
      items: sampleWardrobe,
      error:
        'Your saved wardrobe could not be read. Showing the sample collection.',
    }
  }
}
export function getWardrobeSnapshot(): Snapshot {
  snapshot ??= read()
  return snapshot
}
function emit() {
  listeners.forEach((listener) => listener())
}
function onStorage(event: StorageEvent) {
  if (event.key === storageKey || event.key === null) {
    snapshot = read()
    emit()
  }
}
export function subscribeWardrobe(listener: () => void) {
  if (!listeners.size) window.addEventListener('storage', onStorage)
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
    if (!listeners.size) window.removeEventListener('storage', onStorage)
  }
}
function write(items: WardrobeItem[]): boolean {
  try {
    localStorage.setItem(storageKey, JSON.stringify(items))
    snapshot = { items, error: '' }
    emit()
    return true
  } catch {
    snapshot = {
      ...getWardrobeSnapshot(),
      error:
        'Your browser could not save this change. Storage may be full or unavailable. Try a smaller photo; no changes were saved.',
    }
    emit()
    return false
  }
}
export function saveWardrobeItem(draft: WardrobeDraft, id?: string): boolean {
  const current = getWardrobeSnapshot().items
  const existing = current.find((item) => item.id === id)
  if (!existing && current.length >= 60) {
    snapshot = {
      items: current,
      error:
        'This browser wardrobe holds up to 60 items. Remove a piece before adding another.',
    }
    emit()
    return false
  }
  const item: WardrobeItem = {
    ...draft,
    id: existing?.id ?? `closet-${crypto.randomUUID()}`,
    sample: existing?.sample ?? false,
    addedAt: existing?.addedAt ?? Date.now(),
  }
  if (!isItem(item)) return false
  return write(
    existing
      ? current.map((entry) => (entry.id === existing.id ? item : entry))
      : [item, ...current],
  )
}
export function removeWardrobeItem(id: string) {
  return write(getWardrobeSnapshot().items.filter((item) => item.id !== id))
}
