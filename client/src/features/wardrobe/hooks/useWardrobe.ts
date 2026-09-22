import { useSession } from '../../auth/sessionContext'
import { useRemote, useAction } from '../../live/hooks'
import { shopApi, type WardrobeRecord } from '../../../services/shopApi'
import { isColor, isKind, kinds } from '../data/options'
import type { WardrobeDraft, WardrobeItem } from '../types'

export function useWardrobe() {
  const { session } = useSession()
  const remote = useRemote(async () => {
    const rows = await shopApi.wardrobe()
    return Promise.all(rows.map(async (row): Promise<WardrobeItem> => {
      const photo = await shopApi.wardrobeImage(row.wardrobe_item_id)
      return { id: row.wardrobe_item_id, name: row.name, kind: isKind(row.clothing_type) ? row.clothing_type : row.category_id === 'dresses' ? 'dresses' : row.category_id === 'bottoms' ? 'pants' : 't-shirts',
        color: isColor(row.color) ? row.color : 'cream', rawColor: row.color ?? '', material: row.material ?? '', size: row.size ?? 'One size', image: photo.url, sample: false, addedAt: 0, record: row }
    }))
  }, session?.user.id ?? 'guest', !!session)
  const action = useAction()
  const items = remote.data ?? []
  async function save(draft: WardrobeDraft, id?: string) {
    return action.run(async () => {
      const existing = items.find((item) => item.id === id)
      let image = existing?.record?.image_url
      if (draft.image.startsWith('data:image/')) {
        const blob = await (await fetch(draft.image)).blob()
        image = (await shopApi.uploadWardrobeImage(new File([blob], 'garment.' + (blob.type === 'image/png' ? 'png' : 'jpg'), { type: blob.type }))).image_url
      }
      if (!image) throw new Error('Choose a JPG or PNG photo.')
      const body: Omit<WardrobeRecord, 'wardrobe_item_id'> = { name: draft.name, category_id: kinds[draft.kind].category as 'tops' | 'bottoms' | 'dresses', clothing_type: draft.kind,
        color: existing && draft.color === existing.color ? existing.record?.color ?? draft.color : draft.color,
        material: draft.material || null, size: draft.size || null, image_url: image, style: existing?.record?.style ?? 'casual', pattern: existing?.record?.pattern ?? 'solid' }
      if (id) await shopApi.updateGarment(id, body)
      else await shopApi.addGarment(body)
    })
  }
  return { items, loading: remote.loading, busy: action.busy, error: action.error || remote.error, save,
    remove: (id: string) => action.run(() => shopApi.deleteGarment(id)) }
}
