import type { WardrobeRecord } from '../../services/shopApi'
export type GarmentKind = 't-shirts' | 'shirts' | 'hoodies' | 'jeans' | 'pants' | 'shorts' | 'skirts' | 'dresses'
export type WardrobeCategory = 'all' | 'tops' | 'bottoms' | 'dresses'
export type GarmentColor =
  | 'cream'
  | 'charcoal'
  | 'white'
  | 'camel'
  | 'indigo'
  | 'plum'
  | 'black'
  | 'terracotta'
  | 'sage'
  | 'blue'
export type WardrobeItem = {
  record?: WardrobeRecord
  rawColor?: string
  id: string
  name: string
  kind: GarmentKind
  color: GarmentColor
  material: string
  size: string
  image: string
  sample: boolean
  addedAt: number
}
export type WardrobeDraft = Omit<WardrobeItem, 'id' | 'addedAt' | 'sample'>
