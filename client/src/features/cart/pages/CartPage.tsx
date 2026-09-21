import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { StorefrontHeader } from '../../../components/layout/StorefrontHeader'
import { StorefrontFooter } from '../../../components/layout/StorefrontFooter'
import { Icon } from '../../../components/ui/Icon'
import { useDemoShop } from '../../products/hooks/useDemoShop'
import { demoInventory } from '../../products/data/demoInventory'
import { BagRow } from '../components/BagRow'
import { SavedRadar } from '../components/SavedRadar'
import { OrderSummary } from '../components/OrderSummary'
import { bagTotals } from '../utils/bagTotals'
import '../../products/styles/catalogue.css'
import '../styles/commerce.css'

export default function CartPage() {
  const shop = useDemoShop()
  const [query, setQuery] = useState('')
  const [message, setMessage] = useState('')
  const totals = bagTotals(shop.bag, shop.promoCode)
  const rows = shop.bag.flatMap((item) => {
    const product = demoInventory.find((p) => p.id === item.productId)
    return product ? [{ item, product }] : []
  })
  const visible = rows.filter(({ product }) =>
    `${product.name} ${product.description}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  )
  useEffect(() => {
    document.title = 'Shopping Bag — StyleFit'
    return () => {
      document.title = 'StyleFit'
    }
  }, [])
  useEffect(() => {
    if (!message) return
    const timer = window.setTimeout(() => setMessage(''), 4000)
    return () => window.clearTimeout(timer)
  }, [message])
  return (
    <div className="storefront commerce-page">
      <StorefrontHeader
        query={query}
        onSearch={setQuery}
        bagCount={totals.count}
        contentId="bag-content"
        searchLabel="Search your bag"
      />
      <main className="store-main" id="bag-content" tabIndex={-1}>
        <div className="commerce-container">
          <div className="commerce-title">
            <div>
              <h1>Shopping Bag</h1>
              <span>Edition 04 / {totals.count} Selected Pieces</span>
            </div>
            <span>
              <Icon name="lock" size={15} /> Frontend checkout preview
            </span>
          </div>
          <section className="bag-harmony">
            <div>
              <span className="bag-harmony-icon">
                <Icon name="sparkles" size={24} />
              </span>
              <div>
                <h2>
                  A considered look, coming together{' '}
                  <span>Demo collection</span>
                </h2>
                <p>
                  Bring your selections into the studio to explore color,
                  texture, and silhouette.
                </p>
              </div>
            </div>
            <Link className="button button-plum" to="/matcher">
              Explore the Studio <Icon name="eye" size={16} />
            </Link>
          </section>
          <div className="commerce-columns">
            <section className="cart-items-section" aria-label="Bag items">
              {shop.bag.length ? (
                <>
                  {visible.map(({ item, product }) => (
                    <BagRow
                      key={`${item.productId}-${item.size}`}
                      item={item}
                      product={product}
                      onQuantity={(quantity) => {
                        shop.setQuantity(item.productId, item.size, quantity)
                        if (!quantity)
                          setMessage(`${product.name} removed from your bag.`)
                      }}
                      onSize={(size) =>
                        shop.changeBagSize(item.productId, item.size, size)
                      }
                      onSave={() => {
                        shop.saveForLater(item.productId, item.size)
                        setMessage(`${product.name} saved for later.`)
                      }}
                    />
                  ))}
                  {!visible.length && (
                    <div className="cart-empty">
                      <Icon name="search" size={30} />
                      <h2>No pieces match that search.</h2>
                      <button
                        className="button button-surface"
                        onClick={() => setQuery('')}
                      >
                        Show all bag items
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="cart-empty">
                  <Icon name="bag" size={40} />
                  <h2>A little room for inspiration.</h2>
                  <p>
                    Your bag is empty. Explore the collection or try a sample
                    bag to preview checkout.
                  </p>
                  <div>
                    <Link className="button button-primary" to="/clothes">
                      Explore the collection
                    </Link>
                    <button
                      className="button button-lavender"
                      onClick={() => {
                        shop.addItemsToBag([
                          { productId: 'architecte', size: '38' },
                          { productId: 'nocturne', size: 'S' },
                          { productId: 'sienna', size: '38' },
                        ])
                        setQuery('')
                      }}
                    >
                      Load sample bag
                    </button>
                  </div>
                </div>
              )}
              <div className="bag-bottom-link">
                <span>
                  <Icon name="bag" size={16} />{' '}
                  {totals.subtotal >= 300
                    ? 'Sample standard delivery is complimentary'
                    : 'Sample standard delivery: free from $300'}
                </span>
                <Link to="/clothes">
                  Add Another Piece <Icon name="arrow" size={14} />
                </Link>
              </div>
            </section>
            <OrderSummary
              bag={shop.bag}
              promoCode={shop.promoCode}
              onPromo={shop.setPromoCode}
            >
              {shop.bag.length ? (
                <Link
                  to="/checkout"
                  className="button button-primary full-width"
                >
                  Continue to Checkout <Icon name="arrow" size={17} />
                </Link>
              ) : (
                <button className="button button-primary full-width" disabled>
                  Add a piece to continue
                </button>
              )}
              <div className="express-preview">
                <span>Payment integrations · Coming soon</span>
                <div>
                  <button disabled>Apple Pay</button>
                  <button disabled>Klarna</button>
                </div>
              </div>
            </OrderSummary>
          </div>
          <SavedRadar
            favorites={shop.favorites}
            onFavorite={shop.toggleFavorite}
            onAdd={(id, size, saved) => {
              if (saved) shop.moveFavoriteToBag(id, size)
              else shop.addToBag(id, size)
              setMessage('Piece added to your bag.')
              setQuery('')
            }}
          />
          <div className="commerce-values">
            <div>
              <Icon name="hanger" />
              <span>
                <strong>Considered selections</strong>
                <small>A wardrobe with intention</small>
              </span>
            </div>
            <div>
              <Icon name="bookmark" />
              <span>
                <strong>Keep your favorites</strong>
                <small>Saved in this browser</small>
              </span>
            </div>
            <div>
              <Icon name="eye" />
              <span>
                <strong>Review at your pace</strong>
                <small>No purchase is made</small>
              </span>
            </div>
            <div>
              <Icon name="sparkles" />
              <span>
                <strong>Your next composition</strong>
                <small>Explore the outfit studio</small>
              </span>
            </div>
          </div>
        </div>
      </main>
      <StorefrontFooter />
      {shop.storageError && (
        <p className="storage-notice" role="alert">
          Your changes are available for this visit, but could not be saved in
          this browser.
        </p>
      )}
      <div
        className={`shop-toast${message ? ' visible' : ''}`}
        role="status"
        aria-atomic="true"
      >
        {message && (
          <>
            <Icon name="check" />
            <span>{message}</span>
            <button
              className="icon-button"
              aria-label="Dismiss notification"
              onClick={() => setMessage('')}
            >
              <Icon name="close" size={16} />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
