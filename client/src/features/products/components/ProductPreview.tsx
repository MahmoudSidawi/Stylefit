import { useState } from 'react'
import { Dialog } from '../../../components/ui/Dialog'
import { Icon } from '../../../components/ui/Icon'
import type { Product } from '../types'

export function ProductPreview({
  product: originalProduct,
  onClose,
  onAdd,
}: {
  product: Product
  onClose: () => void
  onAdd: (product: Product, size: string) => Promise<boolean>
}) {
  const [color, setColor] = useState(originalProduct.variants?.[0]?.color ?? '')
  const colorVariants = originalProduct.variants?.filter((v) => v.color === color)
  const sizes = colorVariants ? [...new Set(colorVariants.map((v) => v.size))] : originalProduct.sizes
  const [chosenSize, setSize] = useState(sizes[1] ?? sizes[0])
  const size = sizes.includes(chosenSize) ? chosenSize : sizes[0]
  const selected = colorVariants?.find((v) => v.size === size)
  const product = { ...originalProduct, sizes, variants: colorVariants, price: Number(selected?.price ?? originalProduct.price), image: selected?.image_url ?? originalProduct.image }
  const soldOut = !size || (!!colorVariants && (!selected || selected.stock_quantity < 1))
  const colors = [...new Set(originalProduct.variants?.map((v) => v.color) ?? [])]
  const [busy, setBusy] = useState(false)
  const [added, setAdded] = useState(false)
  return (
    <Dialog title={product.name} onClose={onClose} wide>
      <div className="product-preview">
        <img src={product.image} alt={product.name} />
        <div className="preview-details">
          <span className="overline">StyleFit Essentials</span>
          <p className="preview-price">${product.price}</p>
          <p>{product.description}</p>
          <p className="preview-note">
            Choose a size to add this piece to your bag. Availability is checked when you add it and at checkout.
          </p>
          {colors.length > 1 && <label className="product-color">Color<select aria-label={`Color for ${product.name}`} value={color} onChange={(event) => { setColor(event.target.value) }}>{colors.map((value) => <option key={value}>{value}</option>)}</select></label>}
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
            disabled={busy || soldOut}
            onClick={async () => {
              setBusy(true)
              try { setAdded(await onAdd(product, size)) } finally { setBusy(false) }
            }}
          >
            <Icon name={added ? 'check' : 'bag'} />
            {soldOut ? 'Sold out' : added ? 'Add another to bag' : 'Add to bag'}
          </button>
          <p className="inline-feedback" role="status">
            {added
              ? `Added size ${size} to your bag.`
              : 'Sign in to save items to your bag.'}
          </p>
        </div>
      </div>
    </Dialog>
  )
}
