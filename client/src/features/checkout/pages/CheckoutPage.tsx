import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { StorefrontHeader } from '../../../components/layout/StorefrontHeader'
import { StorefrontFooter } from '../../../components/layout/StorefrontFooter'
import { Icon } from '../../../components/ui/Icon'
import { useDemoShop } from '../../products/hooks/useDemoShop'
import { demoInventory } from '../../products/data/demoInventory'
import { OrderSummary } from '../../cart/components/OrderSummary'
import { bagTotals } from '../../cart/utils/bagTotals'
import type { DeliveryMethod } from '../../cart/utils/bagTotals'
import { CheckoutFields } from '../components/CheckoutFields'
import { OrderPreviewDialog } from '../components/OrderPreviewDialog'
import { emptyDetails, validateCheckout } from '../utils/validateCheckout'
import type { CheckoutErrors, OrderPreview } from '../types'
import { formatMoney } from '../../../utils/currency'
import '../../products/styles/catalogue.css'
import '../../cart/styles/commerce.css'

export default function CheckoutPage() {
  const shop = useDemoShop()
  const [query, setQuery] = useState('')
  const [details, setDetails] = useState({ ...emptyDetails })
  const [errors, setErrors] = useState<CheckoutErrors>({})
  const [delivery, setDelivery] = useState<DeliveryMethod>('standard')
  const [acknowledged, setAcknowledged] = useState(false)
  const [preview, setPreview] = useState<OrderPreview | null>(null)
  const totals = bagTotals(shop.bag, shop.promoCode, delivery)
  const visible = shop.bag.flatMap((item) => {
    const product = demoInventory.find((p) => p.id === item.productId)
    return product &&
      product.name.toLowerCase().includes(query.trim().toLowerCase())
      ? [{ item, product }]
      : []
  })
  useEffect(() => {
    document.title = 'Checkout — StyleFit'
    return () => {
      document.title = 'StyleFit'
    }
  }, [])
  function review(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const next = validateCheckout(details, acknowledged)
    setErrors(next)
    if (Object.keys(next).length) {
      window.requestAnimationFrame(() =>
        document
          .querySelector<HTMLElement>('#checkout-form [aria-invalid="true"]')
          ?.focus(),
      )
      return
    }
    if (!shop.bag.length) return
    setPreview({
      details: { ...details },
      delivery,
      total: totals.total,
      itemCount: totals.count,
    })
  }
  return (
    <div className="storefront commerce-page">
      <StorefrontHeader
        query={query}
        onSearch={setQuery}
        bagCount={totals.count}
        contentId="checkout-content"
        searchLabel="Search order items"
      />
      <main className="store-main" id="checkout-content" tabIndex={-1}>
        <div className="commerce-container">
          <div className="commerce-title">
            <div>
              <h1>Checkout</h1>
              <span>A considered final step</span>
            </div>
            <Link to="/cart">
              <Icon name="arrow" size={15} /> Return to your bag
            </Link>
          </div>
          <nav className="checkout-progress" aria-label="Checkout progress">
            <Link to="/cart">
              <Icon name="check" size={15} /> Shopping Bag
            </Link>
            <span aria-current="step">
              <b>2</b> Details & Delivery
            </span>
            <span>
              <b>3</b> Order Preview
            </span>
          </nav>
          {!shop.bag.length ? (
            <div className="cart-empty checkout-empty">
              <Icon name="bag" size={40} />
              <h2>Your bag is waiting for its first piece.</h2>
              <p>Add something you love before exploring checkout.</p>
              <Link to="/clothes" className="button button-primary">
                Explore the collection
              </Link>
              <Link to="/cart" className="button button-surface">
                Try a sample bag
              </Link>
            </div>
          ) : (
            <>
              <div className="checkout-demo-note">
                <Icon name="info" size={19} />
                <p>
                  <strong>A preview, at your own pace.</strong> Use sample
                  details to try the checkout flow. No payment details are
                  requested and no order will be placed.
                </p>
              </div>
              <div className="commerce-columns checkout-columns">
                <form id="checkout-form" noValidate onSubmit={review}>
                  <CheckoutFields
                    details={details}
                    errors={errors}
                    onChange={setDetails}
                    delivery={delivery}
                    onDelivery={setDelivery}
                    acknowledged={acknowledged}
                    onAcknowledge={setAcknowledged}
                    standardShipping={
                      bagTotals(shop.bag, shop.promoCode).shipping
                    }
                  />
                  {Object.keys(errors).length > 0 && (
                    <p
                      className="commerce-error checkout-form-error"
                      role="alert"
                    >
                      Please check the highlighted fields before reviewing your
                      order.
                    </p>
                  )}
                </form>
                <div className="checkout-summary-column">
                  <section
                    className="checkout-items"
                    aria-label="Your selected pieces"
                  >
                    <div>
                      <h2>Your edit</h2>
                      <Link to="/cart">Edit bag</Link>
                    </div>
                    {visible.map(({ item, product }) => (
                      <article key={`${item.productId}-${item.size}`}>
                        <img src={product.image} alt={product.name} />
                        <div>
                          <h3>{product.name}</h3>
                          <p>
                            Size {item.size} · Quantity {item.quantity}
                          </p>
                          <strong>
                            {formatMoney(product.price * item.quantity)}
                          </strong>
                        </div>
                      </article>
                    ))}
                    {!visible.length && (
                      <p>
                        No pieces match this search.{' '}
                        <button
                          className="text-button"
                          onClick={() => setQuery('')}
                        >
                          Clear search
                        </button>
                      </p>
                    )}
                  </section>
                  <OrderSummary
                    bag={shop.bag}
                    promoCode={shop.promoCode}
                    onPromo={shop.setPromoCode}
                    delivery={delivery}
                  >
                    <button
                      type="submit"
                      form="checkout-form"
                      className="button button-primary full-width"
                    >
                      Review Demo Order <Icon name="arrow" size={16} />
                    </button>
                  </OrderSummary>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
      <StorefrontFooter />
      {shop.storageError && (
        <p className="storage-notice" role="alert">
          Your bag changes could not be saved in this browser.
        </p>
      )}
      {preview && (
        <OrderPreviewDialog
          preview={preview}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  )
}
