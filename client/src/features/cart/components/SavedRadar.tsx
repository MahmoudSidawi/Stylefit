import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../../../components/ui/Icon'
import { formatMoney } from '../../../utils/currency'
import { demoInventory } from '../../products/data/demoInventory'
import { products } from '../../products/data/mockCatalogue'
import type { Product } from '../../products/types'

function RadarCard({
  product,
  saved,
  onFavorite,
  onAdd,
}: {
  product: Product
  saved: boolean
  onFavorite: (id: string) => void
  onAdd: (id: string, size: string, saved: boolean) => void
}) {
  const [size, setSize] = useState(product.sizes[1] ?? product.sizes[0])
  return (
    <article className="radar-card">
      <div className="radar-image">
        <img src={product.image} alt={product.name} loading="lazy" />
        <button
          className={`favorite-button${saved ? ' is-saved' : ''}`}
          aria-label={`${saved ? 'Unsave' : 'Save'} ${product.name}`}
          aria-pressed={saved}
          onClick={() => onFavorite(product.id)}
        >
          <Icon name="heart" size={17} />
        </button>
        <span>From the StyleFit collection</span>
      </div>
      <div className="radar-title">
        <h3>{product.name}</h3>
        <strong>{formatMoney(product.price)}</strong>
      </div>
      <p>{product.description}</p>
      <label className="radar-size">
        Size
        <select
          aria-label={`Saved size for ${product.name}`}
          value={size}
          onChange={(event) => setSize(event.target.value)}
        >
          {product.sizes.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      </label>
      <button
        className="button button-primary"
        onClick={() => onAdd(product.id, size, saved)}
      >
        <Icon name="bag" size={15} />
        {saved ? 'Move to Bag' : 'Add to Bag'}
      </button>
    </article>
  )
}
export function SavedRadar({
  favorites,
  onFavorite,
  onAdd,
}: {
  favorites: string[]
  onFavorite: (id: string) => void
  onAdd: (id: string, size: string, saved: boolean) => void
}) {
  const saved = demoInventory.filter((product) =>
    favorites.includes(product.id),
  )
  const shown = saved.length
    ? saved
    : products.filter((product) =>
        ['camisole', 'polo', 'prune'].includes(product.id),
      )
  return (
    <section className="saved-radar" aria-labelledby="radar-title">
      <div className="radar-heading">
        <div>
          <h2 id="radar-title">
            <Icon name="bookmark" size={23} />
            {saved.length ? 'Saved on Your Radar' : 'A Little More Inspiration'}
          </h2>
          <p>
            {saved.length
              ? 'Your saved pieces, ready when the moment feels right.'
              : 'A few pieces from our sample collection to consider for your next look.'}
          </p>
        </div>
        <Link to="/wardrobe">
          View Your Wardrobe <Icon name="arrow" size={16} />
        </Link>
      </div>
      <div className="radar-grid">
        {shown.map((product) => (
          <RadarCard
            key={product.id}
            product={product}
            saved={favorites.includes(product.id)}
            onFavorite={onFavorite}
            onAdd={onAdd}
          />
        ))}
      </div>
      <p className="radar-footnote">
        <Icon name="info" size={15} /> Thoughtful styling starts with what you
        love. Saved items stay in this browser; availability and price alerts
        are not connected.
      </p>
    </section>
  )
}
