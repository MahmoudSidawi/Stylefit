import { Dialog } from '../../../components/ui/Dialog'
import { Link } from 'react-router-dom'
import { Icon } from '../../../components/ui/Icon'
import { demoInventory as products } from '../data/demoInventory'
import type { BagItem } from '../types'

export function DemoBag({
  items,
  onClose,
  onQuantity,
}: {
  items: BagItem[]
  onClose: () => void
  onQuantity: (id: string, size: string, quantity: number) => void
}) {
  const total = items.reduce(
    (sum, item) =>
      sum +
      (products.find((p) => p.id === item.productId)?.price ?? 0) *
        item.quantity,
    0,
  )
  return (
    <Dialog title="Your demo bag" onClose={onClose}>
      <p className="dialog-intro">
        A local preview of your selections. Checkout is not connected.
      </p>
      {items.length === 0 ? (
        <div className="empty-bag">
          <Icon name="bag" size={38} />
          <h3>A little room for inspiration.</h3>
          <p>Your bag is empty. Find a piece that speaks to you.</p>
          <button className="button button-primary" onClick={onClose}>
            Explore the collection
          </button>
        </div>
      ) : (
        <>
          <ul className="bag-items">
            {items.map((item) => {
              const product = products.find((p) => p.id === item.productId)
              if (!product) return null
              return (
                <li key={`${item.productId}-${item.size}`}>
                  <img src={product.image} alt={product.name} />
                  <div className="bag-item-info">
                    <h3>{product.name}</h3>
                    <p>
                      Size {item.size} · ${product.price}
                    </p>
                    <div className="quantity-control">
                      <button
                        aria-label={`Decrease ${product.name} size ${item.size} quantity`}
                        onClick={() =>
                          onQuantity(
                            item.productId,
                            item.size,
                            item.quantity - 1,
                          )
                        }
                      >
                        −
                      </button>
                      <span aria-label="Quantity">{item.quantity}</span>
                      <button
                        aria-label={`Increase ${product.name} size ${item.size} quantity`}
                        disabled={item.quantity >= 99}
                        onClick={() =>
                          onQuantity(
                            item.productId,
                            item.size,
                            item.quantity + 1,
                          )
                        }
                      >
                        +
                      </button>
                      <button
                        className="remove-item"
                        onClick={() => onQuantity(item.productId, item.size, 0)}
                      >
                        Remove
                        <span className="sr-only">
                          {' '}
                          {product.name}, size {item.size}
                        </span>
                      </button>
                    </div>
                  </div>
                  <strong>${product.price * item.quantity}</strong>
                </li>
              )
            })}
          </ul>
          <div className="bag-total">
            <span>Subtotal</span>
            <strong>${total.toLocaleString('en-US')}</strong>
          </div>
          <Link
            to="/cart"
            className="button button-primary full-width"
            onClick={onClose}
          >
            Review Bag &amp; Checkout
          </Link>
          <button
            className="button button-surface full-width"
            onClick={onClose}
          >
            Continue exploring
          </button>
        </>
      )}
    </Dialog>
  )
}
