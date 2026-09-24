import { DepartmentFilter, type DepartmentSelection } from '../../../components/ui/DepartmentFilter'
import { matchesDepartment } from '../../../utils/departments'
import { Pagination } from '../../../components/ui/Pagination'
import { usePagination } from '../../../components/ui/usePagination'
import { useEffect, useState } from 'react'
import { StorefrontHeader } from '../../../components/layout/StorefrontHeader'
import { StorefrontFooter } from '../../../components/layout/StorefrontFooter'
import { Dialog } from '../../../components/ui/Dialog'
import { Icon } from '../../../components/ui/Icon'
import { shopApi, type GarmentAnalysis } from '../../../services/shopApi'
import { useSession } from '../../auth/sessionContext'
import { useRemote, useAction } from '../../live/hooks'
import { AccountGate, Notice } from '../../live/shared'
import { useWardrobe } from '../hooks/useWardrobe'
import { WardrobeOverview } from '../components/WardrobeOverview'
import { WardrobeCard } from '../components/WardrobeCard'
import { GarmentForm } from '../components/GarmentForm'
import { colors, kinds } from '../data/options'
import type { WardrobeCategory, WardrobeDraft, WardrobeItem } from '../types'
import '../../products/styles/catalogue.css'
import '../styles/wardrobe.css'

type WardrobeDialog =
  | { type: 'add'; file?: File }
  | { type: 'edit' | 'remove'; item: WardrobeItem }
  | null

export default function WardrobePage() {
  const categoryData = useRemote(shopApi.categories, 'categories')
  const wardrobeCategories = [{ id: 'all' as const, label: 'All' }, ...(categoryData.data ?? []).map((row) => ({ id: row.category_id, label: row.name }))]
  const wardrobe = useWardrobe()
  const { session } = useSession()
  const cart = useRemote(shopApi.cart, session?.user.id ?? 'guest', !!session)
  const ai = useAction()
  const [suggestion, setSuggestion] = useState<{ item: WardrobeItem; analysis: GarmentAnalysis } | null>(null)
  const [query, setQuery] = useState('')
  const [department, setDepartment] = useState<DepartmentSelection>('all')
  const [category, setCategory] = useState<WardrobeCategory>('all')
  const [dialog, setDialog] = useState<WardrobeDialog>(null)
  const [message, setMessage] = useState('')
  const [dropError, setDropError] = useState('')
  const visible = wardrobe.items.filter(
    (item) =>
      matchesDepartment(item.department, department) && (category === 'all' || kinds[item.kind].category === category) &&
      `${item.name} ${item.material} ${colors[item.color].label} ${kinds[item.kind].label}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  )
  const pagination = usePagination(visible, 8, JSON.stringify([query, category, department, session?.user.id]))
  useEffect(() => {
    document.title = 'Your Wardrobe — StyleFit'
    return () => {
      document.title = 'StyleFit'
    }
  }, [])
  useEffect(() => {
    if (!message) return
    const timer = window.setTimeout(() => setMessage(''), 5000)
    return () => window.clearTimeout(timer)
  }, [message])
  function openAdd() {
    setDropError('')
    setDialog({ type: 'add' })
  }
  async function save(draft: WardrobeDraft, id?: string) {
    const success = await wardrobe.save(draft, id)
    if (success) {
      setQuery('')
      setCategory('all')
      setDepartment('all')
      setMessage(
        id
          ? 'Garment details updated.'
          : 'Your new piece is saved to your account.',
      )
    }
    return success
  }
  return (
    <div className="storefront wardrobe-page">
      <StorefrontHeader
        query={query}
        onSearch={setQuery}
        contentId="wardrobe-content"
        searchLabel="Search your wardrobe"
        bagCount={cart.data?.reduce((sum, item) => sum + item.quantity, 0) ?? 0}
      />
      <main className="store-main" id="wardrobe-content" tabIndex={-1}>
        <div className="wardrobe-container">
          <div className="wardrobe-heading">
            <div>
              <h1>Your Wardrobe</h1>
              <span className="wardrobe-count">
                {wardrobe.items.length} Curated{' '}
                {wardrobe.items.length === 1 ? 'Item' : 'Items'}
              </span>
              <span className="wardrobe-edition">Your everyday edit</span>
            </div>
            <div className="wardrobe-heading-actions">
              <button className="button button-primary" onClick={openAdd}>
                <Icon name="plus" size={17} /> Add Clothes
              </button>

            </div>
          </div>
          <AccountGate><Notice loading={wardrobe.loading} /><Notice {...ai} />
          <WardrobeOverview
            items={wardrobe.items}
            onAdd={openAdd}
            onDrop={(files) => {
              if (files.length !== 1) {
                setDropError('Add one garment photo at a time.')
                return
              }
              setDropError('')
              setDialog({ type: 'add', file: files[0] })
            }}
          />
          {dropError && (
            <p className="wardrobe-notice" role="alert">
              {dropError}
            </p>
          )}
          {wardrobe.error && (
            <p className="wardrobe-notice" role="alert">
              {wardrobe.error} <button className="text-button" onClick={wardrobe.reload}>Retry wardrobe</button>
            </p>
          )}
          {categoryData.error && <p className="wardrobe-notice" role="alert">Categories could not be loaded. <button className="text-button" onClick={categoryData.reload}>Retry categories</button></p>}
          {wardrobe.items.some((item) => item.imageError) && <p className="wardrobe-notice" role="alert">Some photos could not load. Your clothes are still available. <button className="text-button" onClick={wardrobe.retryPhotos}>Retry photos</button></p>}
          <section
            className="wardrobe-collection"
            aria-label="Your clothing collection"
          >
            <DepartmentFilter value={department} onChange={setDepartment} />
            <div className="wardrobe-filters">
              <div>
                <span className="overline">Catalog filter</span>
                <i />
                <span role="status">
                  Showing {visible.length} of {wardrobe.items.length} garments
                </span>
              </div>
              <div className="wardrobe-filter-chips">
                {wardrobeCategories.map((option) => (
                  <button
                    key={option.id}
                    aria-pressed={category === option.id}
                    onClick={() => setCategory(option.id)}
                  >
                    {option.label} (
                    {
                      wardrobe.items.filter(
                        (item) =>
                          option.id === 'all' ||
                          kinds[item.kind].category === option.id,
                      ).length
                    }
                    )
                  </button>
                ))}
              </div>
            </div>
            <p className="wardrobe-local-note">
              <Icon name="info" size={13} />{' '}
              Your photos are private. Requesting AI suggestions sends the selected photo to Groq.
            </p>
            {visible.length ? (
              <div className="wardrobe-grid">
                {pagination.items.map((item) => (
                  <WardrobeCard
                    key={item.id}
                    item={item}
                    onAnalyze={(item) => { void ai.run(async () => { setSuggestion({ item, analysis: await shopApi.analyzeGarment(item.id) }) }) }}
                    onEdit={(entry) => setDialog({ type: 'edit', item: entry })}
                    onRemove={(entry) =>
                      setDialog({ type: 'remove', item: entry })
                    }
                  />
                ))}
              </div>
            ) : !wardrobe.loading && !wardrobe.error ? (
              <div className="wardrobe-empty">
                <Icon name="hanger" size={40} />
                <h2>
                  {wardrobe.items.length
                    ? 'A different starting point?'
                    : 'Your wardrobe, waiting to happen.'}
                </h2>
                <p>
                  {wardrobe.items.length
                    ? 'No garments match this search or category. Try another filter.'
                    : 'Add your first piece and start making new combinations.'}
                </p>
                <button
                  className="button button-primary"
                  onClick={
                    wardrobe.items.length
                      ? () => {
                          setQuery('')
                          setCategory('all')
                          setDepartment('all')
                        }
                      : openAdd
                  }
                >
                  {wardrobe.items.length
                    ? 'Show all garments'
                    : 'Add your first garment'}
                </button>
              </div>
            ) : null}
            <Pagination {...pagination} />
          </section></AccountGate>
        </div>
      </main>
      <StorefrontFooter />
      <div
        className={`shop-toast${message && !dialog ? ' visible' : ''}`}
        role="status"
        aria-atomic="true"
      >
        {message && !dialog && (
          <>
            <Icon name="check" />
            <span>{message}</span>
            <button
              className="icon-button"
              aria-label="Dismiss notification"
              onClick={() => setMessage('')}
            >
              <Icon name="close" size={16} />
            </button>
          </>
        )}
      </div>
      {(dialog?.type === 'add' || dialog?.type === 'edit') && (
        <GarmentForm
          item={dialog.type === 'edit' ? dialog.item : undefined}
          initialFile={dialog.type === 'add' ? dialog.file : undefined}
          onClose={() => setDialog(null)}
          onSave={save}
          storageError={wardrobe.error}
        />
      )}
      {suggestion && <Dialog title="Suggested garment details" onClose={() => setSuggestion(null)}>
        <p>{suggestion.analysis.description}</p><p>{suggestion.analysis.name} / {suggestion.analysis.clothing_type} / {suggestion.analysis.color}</p>
        <p>Confidence: {suggestion.analysis.confidence}. Review these details before saving.</p><Notice {...ai} />
        <button className="button button-primary" disabled={ai.busy || suggestion.analysis.confidence === 'low'} onClick={() => { void ai.run(async () => {
          const { analysis, item } = suggestion
          if (!item.record) return
          const { wardrobe_item_id: _id, ...record } = item.record
          await shopApi.updateGarment(item.id, { ...record, name: analysis.name, category_id: analysis.category_id, clothing_type: analysis.clothing_type, color: analysis.color, style: analysis.style, pattern: analysis.pattern })
          setSuggestion(null)
        }, 'Details saved.') }}>Use these details</button>
      </Dialog>}
      {dialog?.type === 'remove' && (
        <Dialog title="Remove this piece?" onClose={() => setDialog(null)}>
          <div className="remove-garment-preview">
            <img src={dialog.item.image} alt="" />
            <div>
              <h3>{dialog.item.name}</h3>
              <p>
                This removes the garment and its private photo from your account.
              </p>
            </div>
          </div>
          {wardrobe.error && (
            <p className="wardrobe-field-error" role="alert">
              {wardrobe.error}
            </p>
          )}
          <div className="garment-form-actions">
            <button
              className="button button-surface"
              onClick={() => setDialog(null)}
            >
              Keep garment
            </button>
            <button
              className="button button-primary"
              disabled={wardrobe.busy}
              onClick={async () => {
                if (await wardrobe.remove(dialog.item.id)) {
                  setDialog(null)
                  setMessage('Piece removed from your wardrobe.')
                }
              }}
            >
              Remove garment
            </button>
          </div>
        </Dialog>
      )}
    </div>
  )
}
