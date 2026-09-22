import type { Variant } from '../../services/shopApi'
export type Slot = 'core' | 'anchor' | 'dress'
export type Occasion = 'evening' | 'work' | 'weekend'
export type ArchiveSource = 'store' | 'wardrobe'
export type Garment = {
  variants?: Variant[]
  sample?: boolean
  id: string
  productId?: string
  name: string
  brand: string
  material: string
  source: ArchiveSource
  slot: Slot
  price: number
  sizes: string[]
  image: string
  detailImage: string
  color: string
  colorName: string
  tone: 'warm' | 'cool' | 'neutral'
  drape: 'structured' | 'fluid' | 'soft'
  occasions: Occasion[]
}
export type Selection = { garmentId: string; size: string }
export type SavedLook = {
  id: string
  name: string
  occasion: Occasion
  selection: Selection[]
}
export type MatchResult = {
  score: number
  color: number
  silhouette: number
  occasion: number
  colorNote: string
  silhouetteNote: string
  occasionNote: string
  note: string
}
