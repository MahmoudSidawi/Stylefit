import catalogue from '../../products/data/catalogue.json'
import { getWardrobeSnapshot } from '../../wardrobe/data/wardrobeStore'
import { wardrobeToGarment } from './wardrobeAdapter'
import type { Garment, Slot } from '../types'
export const garments: Garment[] = catalogue.map((item) => ({
  id: item.id, productId: item.id, name: item.name, brand: 'StyleFit Essentials', material: item.description,
  source: 'store', slot: item.category === 'bottoms' ? 'anchor' : item.category === 'dresses' ? 'dress' : 'core',
  price: item.price, sizes: item.sizes, image: item.image, detailImage: item.image, color: item.color,
  colorName: item.category === 'bottoms' ? 'Earth tone' : 'Soft tone', tone: 'neutral', drape: 'soft', occasions: ['work', 'weekend'],
}))
export const slotLabels: Record<Slot, string> = { core: 'Tops', anchor: 'Bottoms', dress: 'Dresses' }
export const slotOrder: Slot[] = ['core', 'anchor', 'dress']
export const initialSelection = [garments[0], garments[3]].map((item) => ({ garmentId: item.id, size: 'M' }))
export const occasionLabels = { evening: 'Outing / Evening', work: 'Office / Workday', weekend: 'Everyday / Weekend' }
export function getGarment(id: string) {
  const fixture = garments.find((item) => item.id === id)
  if (fixture) return fixture
  const item = getWardrobeSnapshot().items.find((entry) => entry.id === id)
  return item ? wardrobeToGarment(item) : undefined
}
