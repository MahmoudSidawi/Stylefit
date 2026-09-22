import type { Variant } from '../../services/shopApi'
export type Category =
  'all' | 'tops' | 'bottoms' | 'dresses'

export type Product = {
  variants?: Variant[]
  id: string
  name: string
  description: string
  price: number
  category: string
  sizes: string[]
  match: number
  note: string
  image: string
}

export type BagItem = { productId: string; size: string; quantity: number }
export type ShopState = { favorites: string[]; bag: BagItem[]; promoCode?: string }
export type SortOrder = 'editorial' | 'match' | 'price-asc' | 'price-desc'
