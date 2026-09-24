import type { Slot } from '../types'

export function slotsConflict(existing: Slot | undefined, added: Slot): boolean {
  return existing === added || (existing === 'dress' && (added === 'anchor' || added === 'core')) ||
    (added === 'dress' && (existing === 'anchor' || existing === 'core'))
}
