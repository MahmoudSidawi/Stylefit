import { useState } from 'react'
import { Link } from 'react-router-dom'
import { StorefrontHeader } from '../../../components/layout/StorefrontHeader'
import { StorefrontFooter } from '../../../components/layout/StorefrontFooter'
import { Icon } from '../../../components/ui/Icon'
import { shopApi } from '../../../services/shopApi'
import { useSession } from '../../auth/sessionContext'
import { useAction, useRemote } from '../../live/hooks'
import { AccountGate, Notice } from '../../live/shared'
import { AccountSummary } from '../../cart/components/AccountSummary'
import { formatMoney } from '../../../utils/currency'
import '../../products/styles/catalogue.css'
import '../../cart/styles/commerce.css'

export default function CheckoutPage() {
  const { session } = useSession()
  const cart = useRemote(shopApi.cart, session?.user.id ?? 'guest', !!session)
  const action = useAction()
  const [query, setQuery] = useState('')
  const [orderId, setOrderId] = useState('')
  const [details, setDetails] = useState({ recipient_name: '', phone: '', delivery_address: '' })
  const rows = cart.data ?? []
  return <div className="storefront commerce-page">
    <StorefrontHeader query={query} onSearch={setQuery} bagCount={rows.reduce((sum, row) => sum + row.quantity, 0)} contentId="checkout-content" searchLabel="Search order items" />
    <main className="store-main" id="checkout-content" tabIndex={-1}><div className="commerce-container">
      <div className="commerce-title"><div><h1>Checkout</h1><span>A considered final step</span></div><Link to="/cart">Return to your bag</Link></div>
      <nav className="checkout-progress" aria-label="Checkout progress"><Link to="/cart"><Icon name="check" size={15} /> Shopping Bag</Link><span aria-current="step"><b>2</b> Details &amp; Delivery</span><span><b>3</b> Order confirmation</span></nav>
      <AccountGate><Notice {...cart} /><Notice {...action} />
      {orderId ? <section className="cart-empty" role="status"><Icon name="check" size={40} /><h2>Your order is placed.</h2><p>Order {orderId}</p><Link className="button button-primary" to="/orders">View your orders</Link></section> : rows.length ? <>
        <div className="checkout-demo-note"><Icon name="info" size={19} /><p><strong>Pay when your order arrives.</strong> Cash on delivery, with complimentary shipping. No card details needed.</p></div>
        <div className="commerce-columns checkout-columns"><form id="checkout-form" onSubmit={(event) => { event.preventDefault(); void action.run(async () => { setOrderId(await shopApi.placeOrder(details)) }) }}>
          <section className="checkout-form-section"><h2>Delivery details</h2><div className="checkout-fields account-delivery-fields">
            <label>Recipient name<input required maxLength={120} autoComplete="name" value={details.recipient_name} onChange={(e) => setDetails({ ...details, recipient_name: e.target.value })} /></label>
            <label>Phone<input required type="tel" minLength={7} maxLength={30} autoComplete="tel" value={details.phone} onChange={(e) => setDetails({ ...details, phone: e.target.value })} /></label>
            <label>Delivery address<textarea required minLength={8} maxLength={500} autoComplete="street-address" value={details.delivery_address} onChange={(e) => setDetails({ ...details, delivery_address: e.target.value })} /></label>
          </div></section>
        </form><div className="checkout-summary-column"><section className="checkout-items" aria-label="Your selected pieces"><div><h2>Your edit</h2><Link to="/cart">Edit bag</Link></div>
          {rows.filter((row) => row.product_variants?.products.name.toLowerCase().includes(query.toLowerCase())).map((row) => <article key={row.cart_item_id}><img src={row.product_variants?.image_url} alt={row.product_variants?.products.name} /><div><h3>{row.product_variants?.products.name}</h3><p>Size {row.product_variants?.size} / Quantity {row.quantity}</p><strong>{formatMoney(Number(row.product_variants?.price ?? 0) * row.quantity)}</strong></div></article>)}
        </section><AccountSummary rows={rows}><button type="submit" form="checkout-form" className="button button-primary full-width" disabled={action.busy || rows.some((row) => !row.product_variants)}>{action.busy ? 'Placing order...' : 'Place order / Cash on delivery'}</button></AccountSummary></div></div>
      </> : !cart.loading && !cart.error && <div className="cart-empty checkout-empty"><Icon name="bag" size={40} /><h2>Your bag is waiting for its first piece.</h2><Link to="/clothes" className="button button-primary">Explore the collection</Link></div>}
      </AccountGate></div></main><StorefrontFooter />
  </div>
}
