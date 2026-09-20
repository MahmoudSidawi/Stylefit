export type Category =
  'all' | 'blazers' | 'silk' | 'trousers' | 'knitwear' | 'outerwear'

export type Product = {
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
