import catalogue from './catalogue.json'
import type { Product } from '../types'

const images = import.meta.glob<string>('../../../assets/storefront/*.jpg', {
  eager: true,
  query: '?url',
  import: 'default',
})

// Supplied design fixtures only. Match scores are not AI predictions.
export const products: Product[] = catalogue.map((product) => ({
  ...product,
  image: images[`../../../assets/storefront/${product.id}.jpg`],
}))

export const categories = [
  { id: 'all', label: 'All Garments' },
  { id: 'blazers', label: 'Tailored Blazers' },
  { id: 'silk', label: 'Silk Tops & Camis' },
  { id: 'trousers', label: 'Pleated Trousers' },
  { id: 'knitwear', label: 'Fine Knitwear' },
  { id: 'outerwear', label: 'Fluid Trench' },
] as const
