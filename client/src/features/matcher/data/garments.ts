import { studioProducts } from '../../products/data/studioProducts'
import { products } from '../../products/data/mockCatalogue'
import type { Garment, Slot } from '../types'
import blazerDetail from '../../../assets/matcher/blazer-detail.jpg'
import camiDetail from '../../../assets/matcher/cami-detail.jpg'
import trousersDetail from '../../../assets/matcher/trousers-detail.jpg'
import pendant from '../../../assets/matcher/pendant.jpg'
import { getWardrobeSnapshot } from '../../wardrobe/data/wardrobeStore'
import { wardrobeToGarment } from './wardrobeAdapter'

const details: Pick<
  Garment,
  | 'brand'
  | 'slot'
  | 'detailImage'
  | 'color'
  | 'colorName'
  | 'tone'
  | 'drape'
  | 'occasions'
>[] = [
  {
    brand: 'Amiens Atelier',
    slot: 'layer',
    detailImage: blazerDetail,
    color: '#e8dbca',
    colorName: 'Oatmeal',
    tone: 'neutral',
    drape: 'structured',
    occasions: ['evening', 'work', 'weekend'],
  },
  {
    brand: 'Maison Séraphine',
    slot: 'core',
    detailImage: camiDetail,
    color: '#b74720',
    colorName: 'Terracotta',
    tone: 'warm',
    drape: 'fluid',
    occasions: ['evening', 'weekend'],
  },
  {
    brand: 'Atelier Marais',
    slot: 'anchor',
    detailImage: trousersDetail,
    color: '#574133',
    colorName: 'Umber',
    tone: 'neutral',
    drape: 'fluid',
    occasions: ['evening', 'work'],
  },
  {
    brand: 'Studio Solene',
    slot: 'footwear',
    detailImage: studioProducts[3].image,
    color: '#3e2920',
    colorName: 'Chocolate',
    tone: 'neutral',
    drape: 'structured',
    occasions: ['evening', 'weekend'],
  },
  {
    brand: 'Atelier Marais',
    slot: 'layer',
    detailImage: studioProducts[4].image,
    color: '#633b5c',
    colorName: 'Plum',
    tone: 'cool',
    drape: 'structured',
    occasions: ['evening', 'work'],
  },
]

const storeGarments: Garment[] = studioProducts.map((product, index) => ({
  ...details[index],
  id: product.id,
  productId: product.id,
  name: product.name,
  material: product.description,
  source: 'store',
  price: product.price,
  sizes: product.sizes,
  image: product.image,
}))

const wardrobeFixtures = [
  {
    productId: 'polo',
    slot: 'core' as const,
    color: '#9b9e82',
    colorName: 'Sage',
    tone: 'cool' as const,
  },
  {
    productId: 'trench',
    slot: 'layer' as const,
    color: '#998374',
    colorName: 'Taupe',
    tone: 'neutral' as const,
  },
  {
    productId: 'palazzo',
    slot: 'anchor' as const,
    color: '#e8dfd0',
    colorName: 'Cream',
    tone: 'neutral' as const,
  },
]

export const garments: Garment[] = [
  ...storeGarments,
  {
    id: 'wardrobe-pendant',
    name: 'Carved Amber Cord Pendant',
    brand: 'Sample Personal Archive',
    material: 'Amber & Waxed Cord',
    source: 'wardrobe',
    slot: 'accessory',
    price: 0,
    sizes: ['One size'],
    image: pendant,
    detailImage: pendant,
    color: '#a87730',
    colorName: 'Amber',
    tone: 'warm',
    drape: 'soft',
    occasions: ['evening', 'weekend'],
  },
  ...wardrobeFixtures.flatMap((fixture): Garment[] => {
    const product = products.find((item) => item.id === fixture.productId)
    return product
      ? [
          {
            id: `wardrobe-${product.id}`,
            name: product.name,
            brand: 'Sample Personal Archive',
            material: product.description,
            source: 'wardrobe',
            slot: fixture.slot,
            price: 0,
            sizes: [product.sizes[1]],
            image: product.image,
            detailImage: product.image,
            color: fixture.color,
            colorName: fixture.colorName,
            tone: fixture.tone,
            drape: 'soft',
            occasions: ['work', 'weekend'],
          },
        ]
      : []
  }),
]

export const slotLabels: Record<Slot, string> = {
  layer: 'Layer',
  core: 'Core',
  anchor: 'Anchor',
  footwear: 'Footwear',
  accessory: 'Accessory',
}
export const slotOrder: Slot[] = [
  'layer',
  'core',
  'anchor',
  'footwear',
  'accessory',
]
export const initialSelection = storeGarments
  .slice(0, 3)
  .map((item) => ({ garmentId: item.id, size: item.sizes[1] }))
export const occasionLabels = {
  evening: 'Vernissage / Evening',
  work: 'Studio / Workday',
  weekend: 'Everyday / Weekend',
}
export function getGarment(id: string) {
  const fixture = garments.find((item) => item.id === id)
  if (fixture) return fixture
  const item = getWardrobeSnapshot().items.find((entry) => entry.id === id)
  return item ? wardrobeToGarment(item) : undefined
}
