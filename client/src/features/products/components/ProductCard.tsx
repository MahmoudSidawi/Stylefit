import { useState } from 'react'
import { Icon } from '../../../components/ui/Icon'
import type { Product } from '../types'

type Props = {
  product: Product
  favorite: boolean
  showNotes: boolean
  onFavorite: (id: string) => void
  onAdd: (product: Product, size: string) => void
  onPreview: (product: Product) => void
}

export function ProductCard({
  product,
  favorite,
  showNotes,
  onFavorite,
  onAdd,
  onPreview,
}: Props) {
  const [size, setSize] = useState(product.sizes[1] ?? product.sizes[0])
  return (
    <article className="product-card">
      <div className="product-image">
        <button
          className="image-preview"
          aria-label={`Preview ${product.name}`}
          onClick={() => onPreview(product)}
        >
          <img
            src={product.image}
            alt={product.description + ', ' + product.name}
            loading="lazy"
          />
        </button>
        {showNotes && (
          <span
            className="match-badge"
            title="Illustrative score from the supplied design, not an AI result"
          >
            <Icon name="sparkles" size={12} />
            {product.match}% · Demo match
          </span>
        )}
        <button
          className={`favorite-button${favorite ? ' is-saved' : ''}`}
          aria-label={`${favorite ? 'Unsave' : 'Save'} ${product.name}`}
          aria-pressed={favorite}
          onClick={() => onFavorite(product.id)}
        >
          <Icon name="heart" size={17} />
        </button>
        {showNotes && <span className="pairing-note">{product.note}</span>}
      </div>
      <div className="product-meta">
        <div className="product-title">
          <h3>
            <button onClick={() => onPreview(product)}>{product.name}</button>
          </h3>
          <span>${product.price}</span>
        </div>
        <p>{product.description}</p>
      </div>
      <fieldset className="size-selector">
        <legend className="sr-only">Size for {product.name}</legend>
        <span aria-hidden="true">Fit:</span>
        {product.sizes.map((option) => (
          <label className={size === option ? 'selected' : ''} key={option}>
            <input
              type="radio"
              name={`size-${product.id}`}
              value={option}
              checked={size === option}
              onChange={() => setSize(option)}
            />
            <span>{option}</span>
          </label>
        ))}
      </fieldset>
      <div className="card-actions">
        <button
          className="button button-lavender"
          onClick={() => onPreview(product)}
        >
          <Icon name="eye" size={15} /> Preview
        </button>
        <button
          className="button button-primary"
          onClick={() => onAdd(product, size)}
        >
          <Icon name="bag" size={15} /> Add to Bag
        </button>
      </div>
    </article>
  )
}
