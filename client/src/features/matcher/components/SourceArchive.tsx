import { shopApi, type ClothingCategory } from '../../../services/shopApi'
import { useRemote } from '../../live/hooks'
import { useRef } from 'react'
import { Icon } from '../../../components/ui/Icon'
import type { ArchiveSource, Garment, Selection, Slot } from '../types'

export type ArchiveFilter = 'all' | Slot
type Props = {
  garments: Garment[]
  source: ArchiveSource
  setSource: (source: ArchiveSource) => void
  filter: ArchiveFilter
  setFilter: (filter: ArchiveFilter) => void
  query: string
  onClearSearch: () => void
  selection: Selection[]
  onStage: (garment: Garment) => void
}
const categorySlots: Record<ClothingCategory, Slot> = { tops: 'core', bottoms: 'anchor', dresses: 'dress', shoes: 'shoes', hats: 'hat' }

export function SourceArchive({
  garments,
  source,
  setSource,
  filter,
  setFilter,
  query,
  onClearSearch,
  selection,
  onStage,
}: Props) {
  const categories = useRemote(shopApi.categories, 'categories')
  const filters: { id: ArchiveFilter; label: string }[] = [{ id: 'all', label: 'All' }, ...(categories.data ?? []).map((row) => ({ id: categorySlots[row.category_id], label: row.name }))]
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const visible = garments.filter(
    (item) =>
      item.source === source &&
      (filter === 'all' || item.slot === filter) &&
      `${item.name} ${item.brand} ${item.material}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  )
  return (
    <aside
      className="source-archive"
      id="source-archive"
      aria-labelledby="archive-title"
    >
      <div className="studio-panel-heading">
        <h2 id="archive-title">
          <Icon name="hanger" size={21} /> Choose clothes
        </h2>
        <span>{visible.length} items</span>
      </div>
      <div className="archive-tabs" role="tablist" aria-label="Garment source">
        {(['store', 'wardrobe'] as const).map((tab, index) => (
          <button
            key={tab}
            ref={(element) => {
              tabRefs.current[index] = element
            }}
            id={`source-${tab}`}
            role="tab"
            aria-selected={source === tab}
            aria-controls="archive-items"
            tabIndex={source === tab ? 0 : -1}
            onClick={() => {
              setSource(tab)
              setFilter('all')
            }}
            onKeyDown={(event) => {
              if (
                ['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)
              ) {
                event.preventDefault()
                const next =
                  event.key === 'Home' ? 0 : event.key === 'End' ? 1 : 1 - index
                setSource(next === 0 ? 'store' : 'wardrobe')
                setFilter('all')
                tabRefs.current[next]?.focus()
              }
            }}
          >
            {tab === 'store' ? 'Store' : 'Your Wardrobe'}{' '}
            <span>
              ({garments.filter((item) => item.source === tab).length})
            </span>
          </button>
        ))}
      </div>
      <div className="archive-filters" aria-label="Archive category">
        {filters.map((item) => (
          <button
            key={item.id}
            aria-pressed={filter === item.id}
            onClick={() => setFilter(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div
        className="archive-items"
        id="archive-items"
        role="tabpanel"
        aria-labelledby={`source-${source}`}
        tabIndex={0}
      >
        {visible.map((item) => {
          const isSelected = selection.some(
            (entry) => entry.garmentId === item.id,
          )
          return (
            <article
              className={`archive-item${isSelected ? ' staged' : ''}${item.source === 'wardrobe' ? ' owned' : ''}`}
              key={item.id}
            >
              <div className="archive-thumbnail">
                <img src={item.image || undefined} alt={item.name} loading="lazy" />
                {item.source === 'wardrobe' && (
                  <span>Owned</span>
                )}
              </div>
              <div className="archive-item-copy">
                <span>{item.brand}</span>
                <h3 title={item.name}>{item.name}</h3>
                <p>
                  {item.source === 'store'
                    ? `$${item.price}`
                    : 'From your wardrobe'}
                </p>
              </div>
              <button
                className="archive-add"
                disabled={isSelected}
                aria-label={
                  isSelected
                    ? `${item.name} is on the canvas`
                    : `Add ${item.name} to canvas`
                }
                onClick={() => onStage(item)}
              >
                <Icon name={isSelected ? 'check' : 'plus'} size={18} />
              </button>
            </article>
          )
        })}
        {!visible.length && (
          <div className="archive-empty">
            <Icon name="search" size={24} />
            <h3>No pieces found</h3>
            <p>Try another category, source, or search.</p>
            <button
              className="text-button"
              onClick={() => {
                setFilter('all')
                onClearSearch()
              }}
            >
              Clear archive filters
            </button>
          </div>
        )}
      </div>
      <p className="archive-help">
        <Icon name="info" size={13} /> One piece per category. Adding another
        piece in the same category replaces the current one. Dresses and bottoms
        replace each other and cannot be worn together in an outfit.
      </p>
      {source === 'wardrobe' && (
        <p className="archive-demo-note">
          Your private wardrobe appears here. Selected photos are sent to Groq when you request an AI match.
        </p>
      )}
    </aside>
  )
}
