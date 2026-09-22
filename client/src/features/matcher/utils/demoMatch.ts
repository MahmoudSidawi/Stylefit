import { getGarment, occasionLabels } from '../data/garments'
import type { MatchResult, Occasion, Selection } from '../types'

export function selectionSignature(selection: Selection[], occasion: Occasion) {
  return JSON.stringify([
    occasion,
    selection.map((entry) => {
      const garment = getGarment(entry.garmentId)
      return [
        entry,
        garment && [
          garment.slot,
          garment.tone,
          garment.drape,
          garment.occasions,
          garment.colorName,
        ],
      ]
    }),
  ])
}

// Transparent local demonstration rules, not a model, fit assessment, or AI call.
export function calculateDemoMatch(
  selection: Selection[],
  occasion: Occasion,
): MatchResult {
  const pieces = selection.flatMap((entry) => {
    const garment = getGarment(entry.garmentId)
    return garment ? [garment] : []
  })
  const tones = new Set(
    pieces
      .filter((piece) => piece.tone !== 'neutral')
      .map((piece) => piece.tone),
  )
  const drapes = new Set(
    pieces
      .map((piece) => piece.drape),
  )
  const hasDress = pieces.some((piece) => piece.slot === 'dress')
  const hasCore = hasDress || pieces.some((piece) => piece.slot === 'core')
  const hasAnchor = hasDress || pieces.some((piece) => piece.slot === 'anchor')
  const color = tones.size > 1 ? 80 : tones.size === 1 ? 96 : 90
  const silhouette = Math.min(
    96,
    60 + (hasCore ? 10 : 0) + (hasAnchor ? 10 : 0) + (drapes.size > 1 ? 8 : 0),
  )
  const aligned = pieces.filter((piece) =>
    piece.occasions.includes(occasion),
  ).length
  const occasionScore = pieces.length
    ? Math.round(55 + (35 * aligned) / pieces.length)
    : 0
  return {
    score: Math.round(color * 0.4 + silhouette * 0.35 + occasionScore * 0.25),
    color,
    silhouette,
    occasion: occasionScore,
    colorNote:
      tones.size > 1
        ? 'Warm and cool accents create a stronger contrast.'
        : 'A consistent tonal family connects the selected pieces.',
    silhouetteNote:
      hasDress
        ? 'A dress gives this look a complete base.'
        : hasCore && hasAnchor
          ? 'A top and bottom give this look a clear foundation.'
          : 'Add a top and bottom, or a dress, for a complete base.',
    occasionNote: `${aligned} of ${pieces.length} pieces have a sample ${occasionLabels[occasion].split(' / ')[1].toLowerCase()} tag.`,
    note: `${pieces.map((piece) => piece.colorName.toLowerCase()).join(', ')} brings ${tones.size > 1 ? 'contrasting accents' : 'a considered tonal rhythm'} to this composition. ${drapes.size > 1 ? 'A mix of structure and drape adds variety.' : 'Similar fabric weights keep the silhouette consistent.'} Try a different layer to explore another direction.`,
  }
}
