import { useState } from 'react'
import type { SavedLook, Selection } from '../types'

const prefix = 'stylefit:account-looks:v2:'
function isSelection(value: unknown): value is Selection {
  if (
    !value ||
    typeof value !== 'object' ||
    !('garmentId' in value) ||
    !('size' in value) ||
    typeof value.garmentId !== 'string' ||
    typeof value.size !== 'string'
  )
    return false
  return value.garmentId.length > 0 && value.size.length > 0
}
function isLook(value: unknown): value is SavedLook {
  if (!value || typeof value !== 'object') return false
  if (
    !('id' in value) ||
    typeof value.id !== 'string' ||
    !('name' in value) ||
    typeof value.name !== 'string' ||
    !value.name.trim() ||
    value.name.length > 60
  )
    return false
  if (
    !('occasion' in value) ||
    !['evening', 'work', 'weekend'].includes(String(value.occasion))
  )
    return false
  if (
    !('selection' in value) ||
    !Array.isArray(value.selection) ||
    value.selection.length < 1 ||
    value.selection.length > 5 ||
    !value.selection.every(isSelection)
  )
    return false
  return (
    new Set(value.selection.map((entry) => entry.garmentId))
      .size === value.selection.length
  )
}
function readLooks(key: string): SavedLook[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? '[]')
    return Array.isArray(value) ? value.filter(isLook).slice(0, 20) : []
  } catch {
    return []
  }
}
export function useSavedLooks(accountId: string) {
  const key = prefix + accountId
  const [looks, setLooks] = useState(() => readLooks(key))
  const [storageError, setStorageError] = useState(false)
  function write(next: SavedLook[]) {
    setLooks(next)
    try {
      localStorage.setItem(key, JSON.stringify(next))
      setStorageError(false)
    } catch {
      setStorageError(true)
    }
  }
  function save(look: Omit<SavedLook, 'id'>) {
    if (looks.length >= 20) return false
    write([{ ...look, id: crypto.randomUUID() }, ...looks])
    return true
  }
  function remove(id: string) {
    write(looks.filter((look) => look.id !== id))
  }
  return { looks, save, remove, storageError }
}
