import { useState } from 'react'
import { Dialog } from '../../../components/ui/Dialog'
import { Icon } from '../../../components/ui/Icon'
import type { Product } from '../types'

export function ProductPreview({
  product,
  onClose,
  onAdd,
}: {
  product: Product
  onClose: () => void
  onAdd: (product: Product, size: string) => void
}) {
  const [size, setSize] = useState(product.sizes[1] ?? product.sizes[0])
  const [added, setAdded] = useState(false)
  return (
    <Dialog title={product.name} onClose={onClose} wide>
      <div className="product-preview">
        <img src={product.image} alt={product.name} />
        <div className="preview-details">
          <span className="overline">Editorial Capsule No. 04</span>
          <p className="preview-price">${product.price}</p>
          <p>{product.description}</p>
          <p className="preview-note">
            A piece from the Spring Architecture collection. This preview uses
            sample product details; availability and measurements are not yet
            connected.
          </p>
          <fieldset className="size-selector">
            <legend>Select your size</legend>
            {product.sizes.map((option) => (
              <label className={size === option ? 'selected' : ''} key={option}>
                <input
                  type="radio"
                  name="preview-size"
                  value={option}
                  checked={size === option}
                  onChange={() => {
                    setSize(option)
                    setAdded(false)
                  }}
                />
                <span>{option}</span>
              </label>
            ))}
          </fieldset>
          <button
            className="button button-primary"
            onClick={() => {
              onAdd(product, size)
              setAdded(true)
            }}
          >
            <Icon name={added ? 'check' : 'bag'} />
            {added ? 'Add another to demo bag' : 'Add to demo bag'}
          </button>
          <p className="inline-feedback" role="status">
            {added
              ? `Added size ${size} to your demo bag.`
              : 'Stored in this browser. No purchase is made.'}
          </p>
        </div>
      </div>
    </Dialog>
  )
}
