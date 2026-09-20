import { Icon } from '../../../components/ui/Icon'
import { formatMoney } from '../../../utils/currency'
import type { BagItem, Product } from '../../products/types'

export function BagRow({
  item,
  product,
  onQuantity,
  onSize,
  onSave,
}: {
  item: BagItem
  product: Product
  onQuantity: (quantity: number) => void
  onSize: (size: string) => void
  onSave: () => void
}) {
  return (
    <article className="cart-row">
      <img src={product.image} alt={product.name} />
      <div className="cart-row-body">
        <div className="cart-row-title">
          <div>
            <span className="overline">The StyleFit Edit</span>
            <h2>{product.name}</h2>
          </div>
          <strong>{formatMoney(product.price * item.quantity)}</strong>
        </div>
        <p className="cart-material">{product.description}</p>
        <div className="cart-size">
          <label>
            Fit size
            <select
              aria-label={`Size for ${product.name}`}
              value={item.size}
              onChange={(event) => onSize(event.target.value)}
            >
              {product.sizes.map((size) => (
                <option key={size}>{size}</option>
              ))}
            </select>
          </label>
          <span>{formatMoney(product.price)} each</span>
        </div>
        <span className="cart-pairing">
          <Icon name="sparkles" size={13} /> A piece for your next composition
        </span>
        <div className="cart-row-actions">
          <div className="cart-quantity">
            <button
              aria-label={`Decrease ${product.name} size ${item.size}`}
              disabled={item.quantity <= 1}
              onClick={() => onQuantity(item.quantity - 1)}
            >
              −
            </button>
            <span aria-label="Quantity">{item.quantity}</span>
            <button
              aria-label={`Increase ${product.name} size ${item.size}`}
              disabled={item.quantity >= 99}
              onClick={() => onQuantity(item.quantity + 1)}
            >
              +
            </button>
          </div>
          <div>
            <button onClick={onSave}>
              <Icon name="bookmark" size={14} /> Save for later
            </button>
            <button
              className="cart-remove"
              onClick={() => onQuantity(0)}
              aria-label={`Remove ${product.name} size ${item.size}`}
            >
              <Icon name="trash" size={14} /> Remove
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}
