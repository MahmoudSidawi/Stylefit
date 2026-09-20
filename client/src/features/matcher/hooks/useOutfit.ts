import { useState } from 'react'
import { getGarment, initialSelection, slotOrder } from '../data/garments'
import { calculateDemoMatch, selectionSignature } from '../utils/demoMatch'
import type { Garment, Occasion, SavedLook, Selection } from '../types'

export function useOutfit(wardrobeId?: string) {
  const [selection, setSelection] = useState<Selection[]>(() => {
    const piece = wardrobeId ? getGarment(wardrobeId) : undefined
    return piece
      ? [
          ...initialSelection.filter(
            (entry) => getGarment(entry.garmentId)?.slot !== piece.slot,
          ),
          { garmentId: piece.id, size: piece.sizes[0] },
        ].sort(
          (a, b) =>
            slotOrder.findIndex(
              (slot) => slot === getGarment(a.garmentId)?.slot,
            ) -
            slotOrder.findIndex(
              (slot) => slot === getGarment(b.garmentId)?.slot,
            ),
        )
      : initialSelection
  })
  const [occasion, setOccasion] = useState<Occasion>('evening')
  const [name, setName] = useState('Vernissage Architecture Ensemble')
  const [analysis, setAnalysis] = useState(() => ({
    signature: selectionSignature(initialSelection, 'evening'),
    result: calculateDemoMatch(initialSelection, 'evening'),
  }))
  const result =
    analysis.signature === selectionSignature(selection, occasion)
      ? analysis.result
      : null
  const selected = selection.flatMap((entry) => {
    const garment = getGarment(entry.garmentId)
    return garment ? [{ garment, size: entry.size }] : []
  })
  const storePieces = selected.filter(
    ({ garment }) => garment.source === 'store',
  )
  const total = storePieces.reduce((sum, { garment }) => sum + garment.price, 0)

  function stage(garment: Garment) {
    setSelection((current) => {
      if (current.some((entry) => entry.garmentId === garment.id))
        return current
      const next = current.filter((entry) => {
        const existing = getGarment(entry.garmentId)
        return existing && existing.slot !== garment.slot
      })
      return [
        ...next,
        { garmentId: garment.id, size: garment.sizes[1] ?? garment.sizes[0] },
      ].sort(
        (a, b) =>
          slotOrder.indexOf(getGarment(a.garmentId)!.slot) -
          slotOrder.indexOf(getGarment(b.garmentId)!.slot),
      )
    })
  }
  function remove(id: string) {
    setSelection((current) => current.filter((entry) => entry.garmentId !== id))
  }
  function changeSize(id: string, size: string) {
    if (!getGarment(id)?.sizes.includes(size)) return
    setSelection((current) =>
      current.map((entry) =>
        entry.garmentId === id ? { ...entry, size } : entry,
      ),
    )
  }
  function checkMatch() {
    if (selected.length < 2) return
    setAnalysis({
      signature: selectionSignature(selection, occasion),
      result: calculateDemoMatch(selection, occasion),
    })
  }
  function reset() {
    setSelection(initialSelection)
    setOccasion('evening')
    setName('Vernissage Architecture Ensemble')
  }
  function load(look: SavedLook) {
    setSelection(look.selection.map((entry) => ({ ...entry })))
    setOccasion(look.occasion)
    setName(look.name)
  }
  return {
    selection,
    selected,
    occasion,
    setOccasion,
    name,
    setName,
    result,
    storePieces,
    total,
    stage,
    remove,
    changeSize,
    checkMatch,
    reset,
    load,
    clear: () => setSelection([]),
  }
}
