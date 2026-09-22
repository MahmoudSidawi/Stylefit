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
    <article className="wardrobe-card">
      <div className="wardrobe-card-image">
        <img src={item.image} alt={item.name} loading="lazy" />
        <span className="wardrobe-kind">{kinds[item.kind].label}</span>
        <span className="wardrobe-source">
          <Icon name={item.sample ? 'sparkles' : 'check'} size={12} />
          {item.sample ? 'Sample piece' : 'Your piece'}
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
      </div>
      <div className="wardrobe-card-title">
        <h2>{item.name}</h2>
        <span>
          <i style={{ backgroundColor: colors[item.color].hex }} />
          {item.rawColor || colors[item.color].label}
        </span>
      </div>
      <div className="wardrobe-tags">
        <span>{item.material}</span>
        <span>Size {item.size}</span>
      </div>
      {onAnalyze && <button className="button button-lavender" onClick={() => onAnalyze(item)}><Icon name="sparkles" size={16} /> Suggest details with AI</button>}
      <Link
        className="button button-primary"
        to={`/matcher?wardrobe=${encodeURIComponent(item.id)}`}
      >
        <Icon name="hanger" size={16} /> Match with Store
      </Link>
    </article>
  )
}
