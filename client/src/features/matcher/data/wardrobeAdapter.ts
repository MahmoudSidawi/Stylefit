import { colors, kinds } from '../../wardrobe/data/options'
import type { WardrobeItem } from '../../wardrobe/types'
import type { Garment } from '../types'
export function wardrobeToGarment(item: WardrobeItem): Garment {
  const category = kinds[item.kind].category
  return { id: item.id, name: item.name, brand: 'Your Wardrobe',
    material: item.material, source: 'wardrobe', slot: category === 'shoes' ? 'shoes' : category === 'hats' ? 'hat' : category === 'bottoms' ? 'anchor' : category === 'dresses' ? 'dress' : 'core',
    price: 0, sizes: [item.size], image: item.image, detailImage: item.image,
    color: colors[item.color].hex, colorName: colors[item.color].label, tone: colors[item.color].tone,
    drape: 'soft', occasions: ['work', 'weekend'] }
}
