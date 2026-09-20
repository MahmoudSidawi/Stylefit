import type { Product } from '../types'
import blazer from '../../../assets/matcher/blazer.jpg'
import cami from '../../../assets/matcher/cami.jpg'
import trousers from '../../../assets/matcher/trousers.jpg'
import sandals from '../../../assets/matcher/sandals.jpg'
import duster from '../../../assets/matcher/duster.jpg'

// Additional sample store inventory for the studio. Prices use the same demo
// currency as the catalogue; these are not live offers or converted prices.
export const studioProducts: Product[] = [
  {
    id: 'studio-blazer',
    name: 'Oatmeal Linen Double Blazer',
    description: '100% French Flax',
    price: 440,
    category: 'blazers',
    sizes: ['36', '38', '40', '42'],
    match: 0,
    note: '',
    image: blazer,
  },
  {
    id: 'studio-cami',
    name: 'Fluid Rust Mulberry Cami',
    description: '22 Momme Silk',
    price: 210,
    category: 'silk',
    sizes: ['XS', 'S', 'M', 'L'],
    match: 0,
    note: '',
    image: cami,
  },
  {
    id: 'studio-trousers',
    name: 'Pleated Wide Trousers',
    description: 'Virgin Wool · Deep Umber',
    price: 380,
    category: 'trousers',
    sizes: ['36', '38', '40', '42'],
    match: 0,
    note: '',
    image: trousers,
  },
  {
    id: 'studio-sandals',
    name: 'Column Heel Leather Sandal',
    description: 'Chocolate Leather',
    price: 320,
    category: 'footwear',
    sizes: ['37', '38', '39', '40'],
    match: 0,
    note: '',
    image: sandals,
  },
  {
    id: 'studio-duster',
    name: 'Midnight Plum Duster',
    description: 'Wool Blend · Deep Plum',
    price: 490,
    category: 'outerwear',
    sizes: ['36', '38', '40', '42'],
    match: 0,
    note: '',
    image: duster,
  },
]
