import { cachedWardrobePhoto, loadWardrobePhoto } from '../data/photoCache'
import { useEffect, useState } from 'react'
import { useSession } from '../../auth/sessionContext'
import { useRemote, useAction } from '../../live/hooks'
import { shopApi, type WardrobeRecord } from '../../../services/shopApi'
import { isColor, isKind, kinds } from '../data/options'
import type { WardrobeDraft, WardrobeItem } from '../types'

export function useWardrobe() {
  const { session } = useSession()
  const userId = session?.user.id
  const remote = useRemote(shopApi.wardrobe, userId ?? 'guest', !!session)
  const [photos, setPhotos] = useState<Record<string, { url: string; error?: boolean }>>({})
  const [photoVersion, setPhotoVersion] = useState(0)
  useEffect(() => {
    let active = true
    const rows = remote.data ?? []
    let next = 0
    async function worker() {
      while (active && next < rows.length) {
        const row = rows[next++]
        const key = `${userId}:${row.wardrobe_item_id}:${row.image_url}`
        if (cachedWardrobePhoto(key)) continue
        try {
          const photo = await loadWardrobePhoto(key, row.wardrobe_item_id)
          if (active) {
            setPhotos((current) => ({ ...current, [key]: { url: photo.url } }))
          }
        } catch {
          if (active) setPhotos((current) => ({ ...current, [key]: { url: '', error: true } }))
        }
      }
    }
    for (let workerIndex = 0; workerIndex < Math.min(4, rows.length); workerIndex++) void worker()
    return () => { active = false }
  }, [remote.data, userId, photoVersion])
  const action = useAction()
  const items: WardrobeItem[] = (remote.data ?? []).map((row) => {
    const key = `${userId}:${row.wardrobe_item_id}:${row.image_url}`
    const photo = cachedWardrobePhoto(key) ?? photos[key]
    return { id: row.wardrobe_item_id, name: row.name, department: row.department, kind: isKind(row.clothing_type) ? row.clothing_type : row.category_id === 'shoes' ? 'shoes' : row.category_id === 'hats' ? 'hats' : row.category_id === 'dresses' ? 'dresses' : row.category_id === 'bottoms' ? 'pants' : 't-shirts',
      color: isColor(row.color) ? row.color : 'cream', rawColor: row.color ?? '', material: row.material ?? '', size: row.size ?? 'One size',
      image: photo?.url ?? '', imageError: photo?.error, addedAt: 0, record: row }
  })
  async function save(draft: WardrobeDraft, id?: string) {
    return action.run(async () => {
      const existing = items.find((item) => item.id === id)
      let image = existing?.record?.image_url
      if (draft.image.startsWith('data:image/')) {
        const blob = await (await fetch(draft.image)).blob()
        image = (await shopApi.uploadWardrobeImage(new File([blob], 'garment.' + (blob.type === 'image/png' ? 'png' : 'jpg'), { type: blob.type }))).image_url
      }
      if (!image) throw new Error('Choose a JPG or PNG photo.')
      const body: Omit<WardrobeRecord, 'wardrobe_item_id'> = { name: draft.name, department: draft.department ?? 'unisex', category_id: kinds[draft.kind].category as 'tops' | 'bottoms' | 'dresses' | 'shoes' | 'hats', clothing_type: draft.kind,
        color: existing && draft.color === existing.color ? existing.record?.color ?? draft.color : draft.color,
        material: draft.material || null, size: draft.size || null, image_url: image, style: existing?.record?.style ?? 'casual', pattern: existing?.record?.pattern ?? 'solid' }
      if (id) await shopApi.updateGarment(id, body)
      else await shopApi.addGarment(body)
    })
  }
  return { items, reload: remote.reload, retryPhotos: () => setPhotoVersion((version) => version + 1), loading: remote.loading, busy: action.busy, error: action.error || remote.error, save,
    remove: (id: string) => action.run(() => shopApi.deleteGarment(id)) }
}
