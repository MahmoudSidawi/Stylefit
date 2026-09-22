import catalogue from './catalogue.json'
import type { Product } from '../types'

export const products: Product[] = catalogue
export const categories = [
  { id: 'all', label: 'All Clothes', description: 'Everyday essentials' },
  { id: 'tops', label: 'Tops', description: 'T-shirts, shirts, hoodies' },
  { id: 'bottoms', label: 'Bottoms', description: 'Jeans, pants, shorts, skirts' },
  { id: 'dresses', label: 'Dresses', description: 'Everyday dresses' },
] as const
