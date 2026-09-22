import { useState } from 'react'
import { Icon } from '../../../components/ui/Icon'
import type { Product } from '../types'

type Props = {
  product: Product
  favorite: boolean
  showNotes: boolean
  onFavorite: (id: string) => void
  onAdd: (product: Product, size: string) => Promise<boolean>
  onPreview: (product: Product) => void
}

export function ProductCard({
  product: originalProduct,
  favorite,
  showNotes,
  onFavorite,
  onAdd,
  onPreview,
}: Props) {
  const [color, setColor] = useState(originalProduct.variants?.[0]?.color ?? '')
  const colorVariants = originalProduct.variants?.filter((v) => v.color === color)
  const sizes = colorVariants ? [...new Set(colorVariants.map((v) => v.size))] : originalProduct.sizes
  const [chosenSize, setSize] = useState(sizes[1] ?? sizes[0])
  const size = sizes.includes(chosenSize) ? chosenSize : sizes[0]
  const selected = colorVariants?.find((v) => v.size === size)
  const product = { ...originalProduct, sizes, variants: colorVariants, price: Number(selected?.price ?? originalProduct.price), image: selected?.image_url ?? originalProduct.image }
  const soldOut = !size || (!!colorVariants && (!selected || selected.stock_quantity < 1))
  const colors = [...new Set(originalProduct.variants?.map((v) => v.color) ?? [])]
  const [adding, setAdding] = useState(false)
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

        <button
          className={`favorite-button${favorite ? ' is-saved' : ''}`}
          aria-label={`${favorite ? 'Unsave' : 'Save'} ${product.name}`}
          aria-pressed={favorite}
          onClick={() => onFavorite(product.id)}
        >
          <Icon name="heart" size={17} />
        </button>
        {showNotes && product.note && <span className="pairing-note">{product.note}</span>}
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
      {colors.length > 1 && <label className="product-color">Color<select aria-label={`Color for ${product.name}`} value={color} onChange={(event) => { setColor(event.target.value) }}>{colors.map((value) => <option key={value}>{value}</option>)}</select></label>}
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
          disabled={adding || soldOut}
          onClick={async () => { setAdding(true); try { await onAdd(product, size) } finally { setAdding(false) } }}
        >
          <Icon name="bag" size={15} /> {soldOut ? 'Sold out' : adding ? 'Adding...' : 'Add to Bag'}
        </button>
      </div>
    </article>
  )
}
