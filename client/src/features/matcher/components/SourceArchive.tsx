import { useRef } from 'react'
import { Icon } from '../../../components/ui/Icon'
import { garments as sampleGarments } from '../data/garments'
import { useWardrobe } from '../../wardrobe/hooks/useWardrobe'
import { wardrobeToGarment } from '../data/wardrobeAdapter'
import type { ArchiveSource, Garment, Selection, Slot } from '../types'

export type ArchiveFilter = 'all' | Slot
type Props = {
  source: ArchiveSource
  setSource: (source: ArchiveSource) => void
  filter: ArchiveFilter
  setFilter: (filter: ArchiveFilter) => void
  query: string
  onClearSearch: () => void
  selection: Selection[]
  onStage: (garment: Garment) => void
}
const filters: { id: ArchiveFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'core', label: 'Tops' },
  { id: 'layer', label: 'Outerwear' },
  { id: 'anchor', label: 'Trousers' },
  { id: 'footwear', label: 'Shoes' },
  { id: 'accessory', label: 'Accessories' },
]

export function SourceArchive({
  source,
  setSource,
  filter,
  setFilter,
  query,
  onClearSearch,
  selection,
  onStage,
}: Props) {
  const wardrobe = useWardrobe()
  const garments = [
    ...sampleGarments.filter((item) => item.source === 'store'),
    ...wardrobe.items.map(wardrobeToGarment),
  ]
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
          <Icon name="hanger" size={21} /> Source Archive
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
            {tab === 'store' ? 'Atelier Store' : 'Your Wardrobe'}{' '}
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
                <img src={item.image} alt={item.name} loading="lazy" />
                {item.source === 'wardrobe' && (
                  <span>{item.sample ? 'Sample' : 'Owned'}</span>
                )}
              </div>
              <div className="archive-item-copy">
                <span>{item.brand}</span>
                <h3 title={item.name}>{item.name}</h3>
                <p>
                  {item.source === 'store'
                    ? `$${item.price}`
                    : item.sample
                      ? 'Sample wardrobe piece'
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
        <Icon name="info" size={13} /> One piece per outfit slot. Adding another
        layer replaces the current one.
      </p>
      {source === 'wardrobe' && (
        <p className="archive-demo-note">
          Your browser wardrobe appears here. Example garments are labeled
          Sample; your own pieces are labeled Owned.
        </p>
      )}
    </aside>
  )
}
