import catalogue from '../../products/data/catalogue.json'
import type { GarmentKind, WardrobeItem } from '../types'
export const sampleWardrobe: WardrobeItem[] = catalogue.map((item, index) => ({
  id: `closet-${item.id}`, name: item.name, kind: item.kind as GarmentKind,
  color: 'cream', material: 'Everyday essentials', size: 'M', image: item.image,
  sample: true, addedAt: index,
}))
