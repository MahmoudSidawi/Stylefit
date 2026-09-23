import type { Variant } from '../../services/shopApi'
export type Category =
  'all' | 'tops' | 'bottoms' | 'dresses' | 'shoes' | 'hats'

export type Product = {
  variants?: Variant[]
  id: string
  name: string
  description: string
  price: number
  category: string
  sizes: string[]
  note: string
  image: string
}

export type BagItem = { productId: string; size: string; quantity: number }
export type SortOrder = 'editorial' | 'price-asc' | 'price-desc'
