export type GarmentKind =
  | 'knitwear'
  | 'shirts'
  | 'tailoring'
  | 'denim'
  | 'outerwear'
  | 'footwear'
  | 'accessories'
export type WardrobeCategory =
  'all' | 'tops' | 'trousers' | 'outerwear' | 'accessories'
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
