import type { WardrobeItem } from '../types'
import cashmere from '../../../assets/wardrobe/cashmere.jpg'
import trousers from '../../../assets/wardrobe/trousers.jpg'
import shirt from '../../../assets/wardrobe/shirt.jpg'
import coat from '../../../assets/wardrobe/coat.jpg'
import denim from '../../../assets/wardrobe/denim.jpg'
import loafers from '../../../assets/wardrobe/loafers.jpg'

export const sampleWardrobe: WardrobeItem[] = [
  {
    id: 'closet-cashmere',
    name: 'Ribbed Cashmere Turtleneck',
    kind: 'knitwear',
    color: 'cream',
    material: '100% Mongolian Cashmere',
    size: 'M',
    image: cashmere,
    sample: true,
    addedAt: 6,
  },
  {
    id: 'closet-trousers',
    name: 'Double-Pleat Charcoal Trousers',
    kind: 'tailoring',
    color: 'charcoal',
    material: 'High-Twist Wool',
    size: 'Waist 32',
    image: trousers,
    sample: true,
    addedAt: 5,
  },
  {
    id: 'closet-shirt',
    name: 'Architectural Poplin Shirt',
    kind: 'shirts',
    color: 'white',
    material: 'Organic Giza Cotton',
    size: '39',
    image: shirt,
    sample: true,
    addedAt: 4,
  },
  {
    id: 'closet-coat',
    name: 'Belted Wool Overcoat',
    kind: 'outerwear',
    color: 'camel',
    material: 'Double-Faced Wool',
    size: 'L',
    image: coat,
    sample: true,
    addedAt: 3,
  },
  {
    id: 'closet-denim',
    name: 'Kurabo Selvedge Denim',
    kind: 'denim',
    color: 'indigo',
    material: '13.5oz Rigid Cotton',
    size: '31',
    image: denim,
    sample: true,
    addedAt: 2,
  },
  {
    id: 'closet-loafers',
    name: 'Artisan Penny Loafers',
    kind: 'footwear',
    color: 'plum',
    material: 'Goodyear Welted Leather',
    size: 'EU 42',
    image: loafers,
    sample: true,
    addedAt: 1,
  },
]
