import type { WardrobeRecord } from '../../services/shopApi'
export type GarmentKind = 't-shirts' | 'shirts' | 'hoodies' | 'jeans' | 'pants' | 'shorts' | 'skirts' | 'dresses' | 'shoes' | 'hats'
export type WardrobeCategory = 'all' | 'tops' | 'bottoms' | 'dresses' | 'shoes' | 'hats'
export type GarmentColor =
  | 'red'
  | 'grey'
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
  imageError?: boolean
  record?: WardrobeRecord
  rawColor?: string
  id: string
  name: string
  kind: GarmentKind
  color: GarmentColor
  material: string
  size: string
  image: string
  addedAt: number
}
export type WardrobeDraft = Omit<WardrobeItem, 'id' | 'addedAt'>
