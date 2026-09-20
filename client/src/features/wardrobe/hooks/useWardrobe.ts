import { useSyncExternalStore } from 'react'
import {
  getWardrobeSnapshot,
  subscribeWardrobe,
  saveWardrobeItem,
  removeWardrobeItem,
} from '../data/wardrobeStore'

export function useWardrobe() {
  const state = useSyncExternalStore(subscribeWardrobe, getWardrobeSnapshot)
  return { ...state, save: saveWardrobeItem, remove: removeWardrobeItem }
}
