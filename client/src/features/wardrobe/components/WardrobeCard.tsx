import { CollectionCard } from '../../products/components/CollectionCard'
import { Link } from 'react-router-dom'
import { Icon } from '../../../components/ui/Icon'
import { colors, kinds } from '../data/options'
import type { WardrobeItem } from '../types'

export function WardrobeCard({
  item,
  onEdit,
  onRemove,
  onAnalyze,
}: {
  onAnalyze?: (item: WardrobeItem) => void
  item: WardrobeItem
  onEdit: (item: WardrobeItem) => void
  onRemove: (item: WardrobeItem) => void
}) {
  return (
    <CollectionCard className="wardrobe-card"
      title={<button onClick={() => onEdit(item)}>{item.name}</button>}
      description={`${kinds[item.kind].label} / ${item.material} / ${item.rawColor || colors[item.color].label}`}
      image={<>
        <>{item.image ? <img src={item.image} alt={item.name} loading="lazy" /> : <div className="wardrobe-photo-status" role="status"><Icon name="hanger" size={32} /><span>{item.imageError ? "Photo unavailable" : "Loading photo..."}</span></div>}</>
        <span className="wardrobe-kind">{kinds[item.kind].label}</span>
        <span className="wardrobe-source">
          <Icon name="check" size={12} />
          Your piece
        </span>
        <div className="wardrobe-card-tools">
          <button
            className="icon-button"
            aria-label={`Edit ${item.name}`}
            onClick={() => onEdit(item)}
          >
            <Icon name="edit" size={16} />
          </button>
          <button
            className="icon-button"
            aria-label={`Remove ${item.name}`}
            onClick={() => onRemove(item)}
          >
            <Icon name="trash" size={16} />
          </button>
        </div>
      </>}
    >
      <div className="size-selector"><span>Fit:</span><span className="owned-size">{item.size}</span></div>
      <div className="card-actions">
      {onAnalyze && <button className="button button-lavender" onClick={() => onAnalyze(item)}><Icon name="sparkles" size={16} /> <span>Suggest details with AI</span></button>}
      <Link
        className="button button-primary"
        to={`/matcher?wardrobe=${encodeURIComponent(item.id)}`}
      >
        <Icon name="hanger" size={16} /> Match with Store
      </Link>
    </div>
    </CollectionCard>
  )
}
