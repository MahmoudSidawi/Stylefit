import { DepartmentSelect } from '../../../components/ui/DepartmentFilter'
import { shopApi } from '../../../services/shopApi'
import { useRemote } from '../../live/hooks'
import { useEffect, useRef, useState } from 'react'
import { Dialog } from '../../../components/ui/Dialog'
import { Icon } from '../../../components/ui/Icon'
import { colors, isColor, isKind, kinds } from '../data/options'
import { readPhoto } from '../utils/readPhoto'
import type { WardrobeDraft, WardrobeItem } from '../types'

type Props = {
  item?: WardrobeItem
  initialFile?: File
  storageError: string
  onSave: (draft: WardrobeDraft, id?: string) => Promise<boolean>
  onClose: () => void
}
type Errors = Partial<Record<'name' | 'material' | 'size' | 'image', string>>

export function GarmentForm({
  item,
  initialFile,
  storageError,
  onSave,
  onClose,
}: Props) {
  const categories = useRemote(shopApi.categories, 'categories')
  const availableKinds = (categories.data ?? []).flatMap((row) => row.clothing_types).filter(isKind)
  const [draft, setDraft] = useState<WardrobeDraft>(() =>
    item
      ? { ...item }
      : {
          name: '',
          department: 'unisex',
          material: '',
          size: '',
          image: '',
          kind: 't-shirts',
          color: 'cream',
        },
  )
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [photoError, setPhotoError] = useState('')
  const [reading, setReading] = useState(!!initialFile)
  const input = useRef<HTMLInputElement>(null)
  const request = useRef(0)
  const lifecycle = useRef({ active: true })
  useEffect(() => {
    const state = lifecycle.current
    state.active = true
    return () => {
      state.active = false
    }
  }, [])
  async function chooseFile(file: File) {
    const version = ++request.current
    setReading(true)
    setPhotoError('')
    try {
      const image = await readPhoto(file)
      if (lifecycle.current.active && version === request.current) {
        setDraft((current) => ({ ...current, image }))
        setErrors((current) => ({ ...current, image: undefined }))
      }
    } catch (error) {
      if (lifecycle.current.active && version === request.current)
        setPhotoError(
          error instanceof Error
            ? error.message
            : 'The photo could not be read.',
        )
    } finally {
      if (lifecycle.current.active && version === request.current)
        setReading(false)
    }
  }
  useEffect(() => {
    if (!initialFile) return
    let cancelled = false
    const version = request.current
    readPhoto(initialFile)
      .then((image) => {
        if (!cancelled && version === request.current)
          setDraft((current) => ({ ...current, image }))
      })
      .catch((error: unknown) => {
        if (!cancelled && version === request.current)
          setPhotoError(
            error instanceof Error
              ? error.message
              : 'The photo could not be read.',
          )
      })
      .finally(() => {
        if (!cancelled && version === request.current) setReading(false)
      })
    return () => {
      cancelled = true
    }
  }, [initialFile])

  async function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving || reading || photoError) return
    const next: Errors = {}
    if (draft.name.trim().length < 3)
      next.name = 'Enter a name with at least 3 characters.'
    if (!draft.material.trim()) next.material = 'Enter the fabric or material.'
    if (!draft.size.trim()) next.size = 'Enter a size, or “One size”.'
    if (!draft.image && !item?.record?.image_url) next.image = 'Choose a photo of this garment.'
    setErrors(next)
    if (Object.keys(next).length) return
    setSaving(true)
    const success = await onSave(
        {
          ...draft,
          name: draft.name.trim(),
          material: draft.material.trim(),
          size: draft.size.trim(),
        },
        item?.id,
      )
    setSaving(false)
    if (success) onClose()
  }

  return (
    <Dialog
      title={item ? 'Edit your garment' : 'A new piece, a new possibility'}
      onClose={onClose}
      wide
    >
      <p className="dialog-intro">
        Your photo is saved privately to your account. After saving, you can ask AI to suggest garment details.
      </p>
      <form className="garment-form" noValidate onSubmit={submit}>
        <div className="garment-photo-field">
          <button
            type="button"
            className={`photo-picker${draft.image ? ' has-photo' : ''}`}
            aria-label={
              draft.image ? 'Replace garment photo' : 'Choose garment photo'
            }
            aria-describedby="photo-help photo-error"
            onClick={() => input.current?.click()}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault()
              if (event.dataTransfer.files.length !== 1) {
                setPhotoError('Add one garment photo at a time.')
                return
              }
              void chooseFile(event.dataTransfer.files[0])
            }}
          >
            {draft.image ? (
              <img src={draft.image} alt="Garment photo preview" />
            ) : (
              <>
                <Icon name="camera" size={34} />
                <strong>Give your piece a portrait</strong>
                <span>Choose a photo or drop it here</span>
              </>
            )}
            <span className="photo-picker-action">
              <Icon name="upload" size={16} />
              {reading
                ? 'Reading photo…'
                : draft.image
                  ? 'Replace photo'
                  : 'Choose photo'}
            </span>
          </button>
          <input
            ref={input}
            className="sr-only"
            type="file"
            accept="image/jpeg,image/png"
            tabIndex={-1}
            aria-label="Garment photo file"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void chooseFile(file)
              event.target.value = ''
            }}
          />
          <p id="photo-help">JPG or PNG · Up to 5 MB</p>
          <p
            id="photo-error"
            className="wardrobe-field-error"
            role={photoError || errors.image ? 'alert' : undefined}
          >
            {photoError || errors.image}
          </p>
          <span className="sr-only" role="status">
            {reading ? 'Reading photo' : ''}
          </span>
        </div>
        <div className="garment-fields">
          <label htmlFor="garment-name">
            Garment name
            <input
              id="garment-name"
              value={draft.name}
              maxLength={70}
              placeholder="e.g. Ribbed Cashmere Turtleneck"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'name-error' : undefined}
              onChange={(event) =>
                setDraft({ ...draft, name: event.target.value })
              }
            />
          </label>
          {errors.name && (
            <p id="name-error" className="wardrobe-field-error" role="alert">
              {errors.name}
            </p>
          )}
          <div className="garment-field-row">
            <label htmlFor="garment-kind">
              Category
              <select
                id="garment-kind"
                value={draft.kind}
                onChange={(event) => {
                  if (isKind(event.target.value))
                    setDraft({ ...draft, kind: event.target.value })
                }}
              >
                {availableKinds.map((id) => (
                  <option key={id} value={id}>
                    {kinds[id].label}
                  </option>
                ))}
              </select>
            </label>
            <label htmlFor="garment-color">
              Color
              <select
                id="garment-color"
                value={draft.color}
                onChange={(event) => {
                  if (isColor(event.target.value))
                    setDraft({ ...draft, color: event.target.value })
                }}
              >
                {Object.entries(colors).map(([id, value]) => (
                  <option key={id} value={id}>
                    {value.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <DepartmentSelect value={draft.department} onChange={(department) => setDraft({ ...draft, department })} />
          <label htmlFor="garment-material">
            Fabric / material
            <input
              id="garment-material"
              value={draft.material}
              maxLength={70}
              placeholder="e.g. 100% cotton"
              aria-invalid={!!errors.material}
              aria-describedby={errors.material ? 'material-error' : undefined}
              onChange={(event) =>
                setDraft({ ...draft, material: event.target.value })
              }
            />
          </label>
          {errors.material && (
            <p
              id="material-error"
              className="wardrobe-field-error"
              role="alert"
            >
              {errors.material}
            </p>
          )}
          <label htmlFor="garment-size">
            Size
            <input
              id="garment-size"
              value={draft.size}
              maxLength={20}
              placeholder="e.g. M, EU 38, or One size"
              aria-invalid={!!errors.size}
              aria-describedby={errors.size ? 'size-error' : undefined}
              onChange={(event) =>
                setDraft({ ...draft, size: event.target.value })
              }
            />
          </label>
          {errors.size && (
            <p id="size-error" className="wardrobe-field-error" role="alert">
              {errors.size}
            </p>
          )}
          <p className="garment-form-note">
            <Icon name="info" size={15} /> Choose the closest color family.
            These tags help organize your wardrobe and inform AI styling suggestions.
          </p>
          {storageError && (
            <p className="wardrobe-field-error" role="alert">
              {storageError}
            </p>
          )}
          <div className="garment-form-actions">
            <button
              className="button button-surface"
              type="button"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="button button-primary"
              type="submit"
              disabled={saving || reading || !!photoError}
            >
              <Icon name="check" size={16} />
              {reading
                ? 'Reading photo…'
                : item
                  ? 'Save changes'
                  : 'Add to Wardrobe'}
            </button>
          </div>
        </div>
      </form>
    </Dialog>
  )
}
