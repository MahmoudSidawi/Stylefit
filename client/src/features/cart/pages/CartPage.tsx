import { useState } from 'react'
import { Link } from 'react-router-dom'
import { StorefrontHeader } from '../../../components/layout/StorefrontHeader'
import { StorefrontFooter } from '../../../components/layout/StorefrontFooter'
import { Icon } from '../../../components/ui/Icon'
import { shopApi } from '../../../services/shopApi'
import { useSession } from '../../auth/sessionContext'
import { useAction, useRemote } from '../../live/hooks'
import { AccountGate, Notice } from '../../live/shared'
import { toProduct } from '../../products/data/apiCatalogue'
import { BagRow } from '../components/BagRow'
import { AccountSummary } from '../components/AccountSummary'
import '../../products/styles/catalogue.css'
import '../styles/commerce.css'

export default function CartPage() {
  const { session } = useSession()
  const cart = useRemote(async () => {
    const rows = await shopApi.cart()
    const ids = [...new Set(rows.flatMap((row) => row.product_variants ? [row.product_variants.products.product_id] : []))]
    const products = await Promise.all(ids.map((id) => shopApi.product(id).catch(() => null)))
    return rows.map((row) => {
      const variant = row.product_variants
      if (!variant) return row
      const full = products.find((product) => product?.product_id === variant.products.product_id)
      return { ...row, product_variants: { ...variant, products: full ?? { ...variant.products, product_variants: [variant] } } }
    })
  }, session?.user.id ?? 'guest', !!session)
  const action = useAction()
  const [query, setQuery] = useState('')
  const rows = cart.data ?? []
  const count = rows.reduce((sum, row) => sum + row.quantity, 0)
  return <div className="storefront commerce-page">
    <StorefrontHeader query={query} onSearch={setQuery} bagCount={count} contentId="bag-content" searchLabel="Search your bag" />
    <main className="store-main" id="bag-content" tabIndex={-1}><div className="commerce-container">
      <div className="commerce-title"><div><h1>Shopping Bag</h1><span>Edition 04 / {count} Selected Pieces</span></div><span><Icon name="lock" size={15} /> Cash on delivery</span></div>
      <AccountGate><Notice {...cart} /><Notice {...action} />
      <section className="bag-harmony"><div><span className="bag-harmony-icon"><Icon name="sparkles" size={24} /></span><div><h2>A considered look, coming together</h2><p>Bring your selections into the studio to explore color, texture, and silhouette.</p></div></div><Link className="button button-plum" to="/matcher">Explore the Studio <Icon name="eye" size={16} /></Link></section>
      <div className="commerce-columns"><section className="cart-items-section" aria-label="Bag items">
        {rows.filter((row) => !row.product_variants || row.product_variants.products.name.toLowerCase().includes(query.toLowerCase())).map((row) => {
          const variant = row.product_variants
          if (!variant) return <article key={row.cart_item_id} className="cart-row"><p>Unavailable product</p><button disabled={action.busy} onClick={() => action.run(() => shopApi.removeCartItem(row.variant_id))}>Remove unavailable item</button></article>
          const product = { ...toProduct(variant.products), sizes: [...new Set([variant.size, ...variant.products.product_variants.filter((v) => v.color === variant.color).map((v) => v.size)])], price: Number(variant.price), image: variant.image_url }
          return <fieldset className="account-cart-row" disabled={action.busy} key={row.cart_item_id}><BagRow item={{ productId: product.id, size: variant.size, quantity: row.quantity }} product={product}
            onQuantity={(quantity) => { void action.run(() => quantity ? shopApi.setCartItem(row.variant_id, quantity) : shopApi.removeCartItem(row.variant_id)) }}
            onSize={(size) => { void action.run(async () => {
              const full = await shopApi.product(product.id)
              const next = full.product_variants.find((v) => v.size === size && v.color === variant.color && v.is_active && v.stock_quantity > 0)
              if (!next) throw new Error('This size is sold out.')
              await shopApi.changeCartVariant(row.variant_id, next.variant_id)
            }) }}
            onSave={() => { void action.run(async () => { await shopApi.saveProduct(product.id); await shopApi.removeCartItem(row.variant_id) }, 'Saved to your wishlist.') }} /></fieldset>
        })}
        {!cart.loading && !cart.error && !rows.length && <div className="cart-empty"><Icon name="bag" size={40} /><h2>A little room for inspiration.</h2><p>Your bag is empty. Explore the collection.</p><Link className="button button-primary" to="/clothes">Explore the collection</Link></div>}
        <div className="bag-bottom-link"><span>Complimentary delivery</span><Link to="/clothes">Add Another Piece <Icon name="arrow" size={14} /></Link></div>
      </section><AccountSummary rows={rows}>{rows.length ? <Link to="/checkout" className="button button-primary full-width">Continue to Checkout <Icon name="arrow" size={17} /></Link> : <button className="button button-primary full-width" disabled>Add a piece to continue</button>}</AccountSummary></div>
      <div className="commerce-values"><Link to="/wishlist">Your saved favorites</Link><Link to="/orders">Your orders</Link><Link to="/matcher">Your next composition</Link></div>
      </AccountGate></div></main><StorefrontFooter />
  </div>
}
