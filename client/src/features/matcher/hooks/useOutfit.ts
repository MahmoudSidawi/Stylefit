import { useState } from 'react'
import { useSession } from '../../auth/sessionContext'
import { useWardrobe } from '../../wardrobe/hooks/useWardrobe'
import { useRemote, useAction } from '../../live/hooks'
import { loadCatalogue } from '../../products/data/apiCatalogue'
import { shopApi, type AiMatch, type MatchSelection } from '../../../services/shopApi'
import { wardrobeToGarment } from '../data/wardrobeAdapter'
import type { Garment, Occasion, SavedLook, Selection, MatchResult } from '../types'

export function useOutfit(wardrobeId?: string) {
  const { session } = useSession()
  const catalogue = useRemote(loadCatalogue, 'studio-products', !!session)
  const wardrobe = useWardrobe()
  const action = useAction()
  const garments: Garment[] = [...(catalogue.data?.items ?? []).flatMap((product) => {
    const variants = product.product_variants.filter((v) => v.is_active)
    return [...new Set(variants.map((v) => v.color))].map((color) => {
      const group = variants.filter((v) => v.color === color)
      return { id: product.product_id + ':' + color, productId: product.product_id, name: product.name, brand: 'StyleFit', material: product.description,
        source: 'store' as const, slot: product.category_id === 'bottoms' ? 'anchor' as const : product.category_id === 'dresses' ? 'dress' as const : 'core' as const,
        price: Number(group[0]?.price ?? 0), sizes: group.map((v) => v.size), image: group[0]?.image_url ?? '', detailImage: group[0]?.image_url ?? '', color, colorName: color,
        tone: 'neutral' as const, drape: 'soft' as const, occasions: ['work', 'weekend'] as Occasion[], variants: group }
    })
  }), ...wardrobe.items.map(wardrobeToGarment)]
  const [selection, setSelection] = useState<Selection[]>(wardrobeId ? [{ garmentId: wardrobeId, size: '' }] : [])
  const [occasion, setOccasion] = useState<Occasion>('weekend')
  const [name, setName] = useState('Everyday essentials')
  const [includeProfile, setIncludeProfile] = useState(false)
  const [analysis, setAnalysis] = useState<{ signature: string; result: AiMatch } | null>(null)
  const signature = JSON.stringify([selection, occasion, includeProfile])
  const ai = analysis?.signature === signature ? analysis.result : null
  const result: MatchResult | null = ai ? { score: ai.score, color: ai.colors.score, silhouette: ai.clothing_types.score, occasion: ai.occasion.score,
    colorNote: ai.colors.explanation, silhouetteNote: ai.clothing_types.explanation, occasionNote: ai.occasion.explanation, note: ai.explanation } : null
  const selected = selection.flatMap((entry) => {
    const garment = garments.find((g) => g.id === entry.garmentId)
    if (!garment) return []
    const size = entry.size || garment.sizes[0]
    const variant = garment.variants?.find((v) => v.size === size)
    return [{ garment: variant ? { ...garment, price: Number(variant.price), detailImage: variant.image_url } : garment, size }]
  })
  const storePieces = selected.filter(({ garment }) => garment.source === 'store')
  function stage(garment: Garment) {
    setSelection((current) => [...current.filter((entry) => garments.find((g) => g.id === entry.garmentId)?.slot !== garment.slot), { garmentId: garment.id, size: garment.sizes[1] ?? garment.sizes[0] }])
  }
  function references(): MatchSelection[] {
    return selected.map(({ garment, size }) => {
      if (garment.source === 'wardrobe') return { source: 'wardrobe', wardrobe_item_id: garment.id }
      const variant = garment.variants?.find((v) => v.size === size)
      if (!variant) throw new Error('Choose an available garment size.')
      return { source: 'store', variant_id: variant.variant_id }
    })
  }
  return { garments, selection, selected, occasion, setOccasion, name, setName, result, ai, includeProfile, setIncludeProfile,
    storePieces, total: storePieces.reduce((sum, { garment }) => sum + garment.price, 0), stage,
    loading: catalogue.loading || wardrobe.loading, error: action.error || catalogue.error || wardrobe.error, busy: action.busy,
    remove: (id: string) => setSelection((current) => current.filter((entry) => entry.garmentId !== id)),
    changeSize: (id: string, size: string) => setSelection((current) => current.map((entry) => entry.garmentId === id ? { ...entry, size } : entry)),
    checkMatch: () => action.run(async () => { if (selected.length < 2) throw new Error('Select two or three pieces.'); setAnalysis({ signature, result: await shopApi.match(references(), occasion, includeProfile) }) }),
    addToBag: () => action.run(async () => { for (const item of references()) if (item.source === 'store') await shopApi.addToCart(item.variant_id) }),
    reset: () => { setSelection([]); setAnalysis(null) },
    load: (look: SavedLook) => { setSelection(look.selection.filter((entry) => garments.some((g) => g.id === entry.garmentId && g.sizes.includes(entry.size)))); setOccasion(look.occasion); setName(look.name) },
    clear: () => setSelection([]) }
}
