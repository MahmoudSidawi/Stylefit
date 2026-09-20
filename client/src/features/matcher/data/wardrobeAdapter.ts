import { colors } from '../../wardrobe/data/options'
import type { WardrobeItem } from '../../wardrobe/types'
import type { Garment, Slot } from '../types'

export function wardrobeToGarment(item: WardrobeItem): Garment {
  const slots: Record<WardrobeItem['kind'], Slot> = {
    knitwear: 'core',
    shirts: 'core',
    tailoring: 'anchor',
    denim: 'anchor',
    outerwear: 'layer',
    footwear: 'footwear',
    accessories: 'accessory',
  }
  return {
    id: item.id,
    name: item.name,
    brand: item.sample ? 'Sample Personal Archive' : 'Your Personal Archive',
    material: item.material,
    source: 'wardrobe',
    slot: slots[item.kind],
    price: 0,
    sizes: [item.size],
    image: item.image,
    detailImage: item.image,
    color: colors[item.color].hex,
    colorName: colors[item.color].label,
    tone: colors[item.color].tone,
    drape:
      item.kind === 'knitwear'
        ? 'soft'
        : item.kind === 'shirts'
          ? 'fluid'
          : 'structured',
    occasions:
      item.kind === 'denim' || item.kind === 'knitwear'
        ? ['weekend']
        : ['evening', 'work'],
    sample: item.sample,
  }
}
