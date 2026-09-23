import { Pagination } from '../../components/ui/Pagination'
import { usePagination } from '../../components/ui/usePagination'
import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useSession } from '../auth/sessionContext'
import { shopApi, type StoreProduct } from '../../services/shopApi'
import { LiveLayout, Notice } from './shared'
import { useAction, useRemote } from './hooks'
import { ProductCard } from '../products/components/ProductCard'
import { ProductPreview } from '../products/components/ProductPreview'
import { toProduct } from '../products/data/apiCatalogue'
import type { Product } from '../products/types'
import { AccountLayout } from '../../pages/AccountLayout'
import { Icon } from '../../components/ui/Icon'
import { formatMoney } from '../../utils/currency'

export function ProductTile({ product, saved = false }: { product: StoreProduct; saved?: boolean }) {
  const [preview, setPreview] = useState<Product | null>(null)
  const action = useAction()
  async function add(item: Product, size: string) {
    return action.run(async () => {
      const variant = item.variants?.find((v) => v.size === size && v.stock_quantity > 0)
      if (!variant) throw new Error('This size is sold out.')
      await shopApi.addToCart(variant.variant_id)
    }, 'Added to your bag.')
  }
  return <div><ProductCard product={toProduct(product)} favorite={saved} showNotes={false} onPreview={setPreview} onAdd={add}
    onFavorite={() => { void action.run(() => saved ? shopApi.unsaveProduct(product.product_id) : shopApi.saveProduct(product.product_id), saved ? 'Removed from wishlist.' : 'Saved to wishlist.') }} />
    <Notice {...action} />{preview && <ProductPreview product={preview} onClose={() => setPreview(null)} onAdd={add} />}
  </div>
}

export function LiveCatalogue() {
  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''
  const [category, setCategory] = useState('')
  const [size, setSize] = useState('')
  const [sort, setSort] = useState('name')
  const [page, setPage] = useState(0)
  const filters = new URLSearchParams({ q: query, sort, limit: '12', offset: String(page * 12) })
  if (category) filters.set('category', category)
  if (size) filters.set('size', size)
  const items = useRemote(() => shopApi.products(filters), filters.toString())
  return <LiveLayout title="Everyday Clothes">
    <p>Tops — T-shirts, shirts, hoodies. Bottoms — jeans, pants, shorts, skirts. Dresses for every day.</p>
    <div className="live-controls">
      <label>Search<input value={query} type="search" onChange={(event) => { setParams({ q: event.target.value }); setPage(0) }} placeholder="Find your next basic" /></label>
      <label>Category<select value={category} onChange={(event) => { setCategory(event.target.value); setPage(0) }}>
        <option value="">All clothes</option><option value="tops">Tops</option><option value="bottoms">Bottoms</option><option value="dresses">Dresses</option><option value="shoes">Shoes</option><option value="hats">Hats</option>
      </select></label>
      <label>Size<select value={size} onChange={(event) => { setSize(event.target.value); setPage(0) }}><option value="">All sizes</option>{['XS', 'S', 'M', 'L', 'XL'].map((s) => <option key={s}>{s}</option>)}</select></label>
      <label>Sort<select value={sort} onChange={(event) => { setSort(event.target.value); setPage(0) }}><option value="name">Name</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option></select></label>
    </div>
    <Notice {...items} />
    {items.error && <button className="button button-surface" onClick={items.reload}>Retry</button>}
    {items.data && <><p>{items.data.total} pieces found</p><div className="live-grid">{items.data.items.map((p) => <ProductTile key={p.product_id} product={p} />)}</div>
      {!items.data.items.length && <p className="live-empty">No clothes match these filters.</p>}
      <div className="live-actions"><button className="button button-surface" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page + 1}</span><button className="button button-surface" disabled={(page + 1) * 12 >= items.data.total} onClick={() => setPage(page + 1)}>Next</button></div></>}
  </LiveLayout>
}

export function LiveProduct() {
  const { productId = '' } = useParams()
  const product = useRemote(() => shopApi.product(productId), productId)
  return <LiveLayout title="Product details"><Notice {...product} />{product.data && <div style={{ maxWidth: 650 }}><ProductTile product={product.data} /></div>}</LiveLayout>
}

export function LiveCart() {
  const { session } = useSession()
  const cart = useRemote(shopApi.cart, session?.user.id ?? '', !!session)
  const action = useAction()
  const total = cart.data?.reduce((sum, row) => sum + Number(row.product_variants?.price ?? 0) * row.quantity, 0) ?? 0
  return <LiveLayout title="Your Shopping Bag" privatePage><Notice {...cart} /><Notice {...action} />
    {cart.data?.map((row) => <article className="live-row" key={row.cart_item_id}>
      {row.product_variants && <img src={row.product_variants.image_url} alt={row.product_variants.products.name} />}
      <div><h2>{row.product_variants?.products.name ?? 'Unavailable product'}</h2><p>{row.product_variants ? `${row.product_variants.size} · ${row.product_variants.color}` : 'Remove this unavailable item before checkout.'}</p></div>
      <label>Quantity <input type="number" min="1" max="99" value={row.quantity} disabled={action.busy} onChange={(event) => {
        const n = Number(event.target.value)
        if (Number.isInteger(n) && n > 0 && n <= 99) void action.run(() => shopApi.setCartItem(row.variant_id, n))
      }} /></label>
      <strong>{formatMoney(Number(row.product_variants?.price ?? 0) * row.quantity)}</strong>
      <button className="button button-surface" disabled={action.busy} onClick={() => action.run(() => shopApi.removeCartItem(row.variant_id))}>Remove</button>
    </article>)}
    {cart.data?.length ? <><h2>Total: {formatMoney(total)}</h2><p>Cash on delivery. No shipping fee. Prices and availability are checked again when you place your order.</p><Link className="button button-primary" to="/checkout">Checkout</Link></> : !cart.loading && <p className="live-empty">Your bag is empty. <Link to="/clothes">Explore clothes</Link>.</p>}
  </LiveLayout>
}

export function LiveCheckout() {
  const { session } = useSession()
  const cart = useRemote(shopApi.cart, session?.user.id ?? '', !!session)
  const action = useAction()
  const [orderId, setOrderId] = useState('')
  const [details, setDetails] = useState({ recipient_name: '', phone: '', delivery_address: '' })
  const total = cart.data?.reduce((sum, row) => sum + Number(row.product_variants?.price ?? 0) * row.quantity, 0) ?? 0
  async function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    await action.run(async () => { setOrderId(await shopApi.placeOrder(details)) })
  }
  return <LiveLayout title="Checkout" privatePage><Notice {...action} /><Notice {...cart} />
    {orderId ? <div role="status"><h2>Your order is placed.</h2><p>Order {orderId}</p><Link to="/orders">View your orders</Link></div> : cart.data?.length ? <>
      <p>Review your bag and delivery details. Pay {formatMoney(total)} on delivery; no card details are needed.</p>
      <form className="live-form" onSubmit={submit}>
        <label>Recipient name<input required maxLength={120} autoComplete="name" value={details.recipient_name} onChange={(e) => setDetails({ ...details, recipient_name: e.target.value })} /></label>
        <label>Phone<input required type="tel" minLength={7} maxLength={30} autoComplete="tel" value={details.phone} onChange={(e) => setDetails({ ...details, phone: e.target.value })} /></label>
        <label>Delivery address<textarea required minLength={8} maxLength={500} autoComplete="street-address" value={details.delivery_address} onChange={(e) => setDetails({ ...details, delivery_address: e.target.value })} /></label>
        <button className="button button-primary" disabled={action.busy}>{action.busy ? 'Placing order…' : 'Place order · Cash on delivery'}</button>
      </form><Link to="/cart">Return to bag</Link>
    </> : !cart.loading && <p>Add clothes to your bag before checkout. <Link to="/clothes">Browse clothes</Link></p>}
  </LiveLayout>
}

export function LiveWishlist() {
  const { session } = useSession()
  const saved = useRemote(shopApi.wishlist, session?.user.id ?? '', !!session)
  const products = saved.data?.filter((row) => row.products) ?? []
  const pagination = usePagination(products, 8, session?.user.id)
  return <AccountLayout title="Saved favorites" description="The pieces you love, ready when you are.">
    {saved.loading && <p className="profile-notice" role="status">Loading your favorites...</p>}
    {saved.error && <div className="profile-notice profile-error" role="alert">{saved.error} <button className="text-button" onClick={saved.reload}>Try again</button></div>}
    {!!products.length && <>
      <section className="account-detail-card account-favorites-heading"><div className="profile-section-heading"><span className="profile-section-icon"><Icon name="heart" size={20} /></span><div><h2>Your collection</h2><p>{products.length} saved {products.length === 1 ? 'piece' : 'pieces'}. Choose a size or take a closer look.</p></div></div><Link to="/clothes">Explore clothes <Icon name="arrow" size={16} /></Link></section>
      <div className="account-favorites-grid">{pagination.items.map((row) => <ProductTile key={row.product_id} product={row.products} saved />)}</div>
      <Pagination {...pagination} />
    </>}
    {!saved.loading && !saved.error && !products.length && <section className="account-detail-card account-orders-empty"><span className="profile-section-icon"><Icon name="heart" size={24} /></span><h2>A place for your favorites.</h2><p>Save the pieces you love while exploring the collection. They’ll appear here.</p><Link className="button button-primary" to="/clothes">Explore the collection<Icon name="arrow" size={16} /></Link></section>}
  </AccountLayout>
}

export function LiveOrders() {
  const { session } = useSession()
  const orders = useRemote(shopApi.orders, session?.user.id ?? '', !!session)
  return <AccountLayout title="My orders" description="Track your purchases, from our collection to your door.">
    {orders.loading && <p className="profile-notice" role="status">Loading your orders...</p>}
    {orders.error && <div className="profile-notice profile-error" role="alert">{orders.error} <button className="text-button" onClick={orders.reload}>Try again</button></div>}
    {orders.data?.map((order) => <article className="account-detail-card account-order" key={order.order_id}>
      <header className="account-order-heading"><div><span className="profile-eyebrow">{new Date(order.created_at).toLocaleDateString()}</span><h2>Order {order.order_id}</h2></div><span className={`account-order-status status-${order.status}`}>{order.status}</span></header>
      <div className="account-order-items">{order.order_items.map((item, index) => <div key={index}><span className="profile-section-icon"><Icon name="bag" size={18} /></span><div><h3>{item.product_name}</h3><p>Size {item.size} / {item.color} / Qty {item.quantity}</p></div><strong>{formatMoney(Number(item.unit_price) * item.quantity)}</strong></div>)}</div>
      <footer className="account-order-total"><span>{order.status === 'cancelled' ? 'Order cancelled' : order.is_paid ? 'Payment collected' : 'Cash on delivery / Payment pending'}</span><div>Total <strong>{formatMoney(Number(order.total_amount))}</strong></div></footer>
      {order.delivery_address && <details className="account-delivery"><summary>Delivery details</summary><p>{order.recipient_name}<br />{order.phone}<br />{order.delivery_address}</p></details>}
    </article>)}
    {!orders.loading && !orders.error && orders.data?.length === 0 && <section className="account-detail-card account-orders-empty"><span className="profile-section-icon"><Icon name="bag" size={24} /></span><h2>Your next favorite is waiting.</h2><p>Your orders will appear here after checkout.</p><Link className="button button-primary" to="/clothes">Explore the collection<Icon name="arrow" size={16} /></Link></section>}
  </AccountLayout>
}
