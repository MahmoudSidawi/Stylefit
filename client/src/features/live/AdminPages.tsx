import { useState } from 'react'
import { useSession } from '../auth/sessionContext'
import { shopApi, type OrderStatus, type StoreProduct, type Variant } from '../../services/shopApi'
import { LiveLayout, Notice } from './shared'
import { useAction, useRemote } from './hooks'
import { clothingKinds } from './clothingKinds'
import { formatMoney } from '../../utils/currency'

function useAdmin() {
  const { session } = useSession()
  return useRemote(shopApi.me, session?.user.id ?? '', !!session)
}

function VariantEditor({ variant }: { variant: Variant }) {
  const [draft, setDraft] = useState(variant)
  const action = useAction()
  return <form className="live-controls" onSubmit={(e) => { e.preventDefault(); void action.run(() => shopApi.updateVariant(draft), 'Variant saved.') }}>
    <label>Size<input required value={draft.size} onChange={(e) => setDraft({ ...draft, size: e.target.value })} /></label>
    <label>Color<input required value={draft.color} onChange={(e) => setDraft({ ...draft, color: e.target.value })} /></label>
    <label>Price<input type="number" min="0.01" step="0.01" required value={draft.price} onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })} /></label>
    <label>Stock<input type="number" min="0" step="1" required value={draft.stock_quantity} onChange={(e) => setDraft({ ...draft, stock_quantity: Number(e.target.value) })} /></label>
    <label className="live-check"><input type="checkbox" checked={draft.is_active} onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })} />Available for sale</label>
    <button className="button button-surface" disabled={action.busy}>Save variant</button><Notice {...action} />
  </form>
}

function ProductEditor({ product }: { product: StoreProduct }) {
  const [draft, setDraft] = useState(product)
  const action = useAction()
  return <details className="live-card"><summary>{product.name} · {product.is_active ? 'Active' : 'Hidden'} · {product.product_variants.length} variants</summary>
    <form className="live-form" onSubmit={(e) => { e.preventDefault(); void action.run(() => shopApi.updateProduct(draft), 'Product saved.') }}>
      <label>Name<input required maxLength={120} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label>
      <label>Description<textarea maxLength={3000} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></label>
      <label>Clothing type<select value={draft.clothing_type} onChange={(e) => setDraft({ ...draft, clothing_type: e.target.value, category_id: clothingKinds[e.target.value as keyof typeof clothingKinds] })}>{Object.keys(clothingKinds).map((type) => <option key={type}>{type}</option>)}</select></label>
      <label>Style<input required value={draft.style} onChange={(e) => setDraft({ ...draft, style: e.target.value })} /></label>
      <label>Pattern<input required value={draft.pattern} onChange={(e) => setDraft({ ...draft, pattern: e.target.value })} /></label>
      <label className="live-check"><input type="checkbox" checked={draft.is_active} onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })} />Show in store</label>
      <button className="button button-primary" disabled={action.busy}>Save product</button><Notice {...action} />
    </form><h3>Size and color variants</h3>{product.product_variants.map((v) => <VariantEditor variant={v} key={v.variant_id} />)}
  </details>
}

export function LiveAdminProducts() {
  const profile = useAdmin()
  const admin = profile.data?.role === 'admin'
  const products = useRemote(shopApi.adminProducts, 'admin-products', admin)
  const action = useAction()
  const initial = { name: '', description: '', clothing_type: 't-shirts', style: 'casual', pattern: 'solid', sizes: 'XS,S,M,L,XL', color: 'White', price: '25', stock: '20', image_url: '/clothes/basic-tee.svg' }
  const [draft, setDraft] = useState(initial)
  const [photo, setPhoto] = useState<File | null>(null)
  async function create(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    await action.run(async () => {
      const sizes = [...new Set(draft.sizes.split(',').map((s) => s.trim()).filter(Boolean))]
      const imageUrl = photo ? (await shopApi.uploadProductImage(photo)).image_url : draft.image_url
      await shopApi.createProduct({ name: draft.name, description: draft.description, clothing_type: draft.clothing_type,
        category_id: clothingKinds[draft.clothing_type as keyof typeof clothingKinds], style: draft.style, pattern: draft.pattern, is_active: true,
        variants: sizes.map((size) => ({ size, color: draft.color, price: Number(draft.price), stock_quantity: Number(draft.stock), image_url: imageUrl, is_active: true })) })
      setDraft(initial); setPhoto(null)
    }, 'Product and variants created.')
  }
  return <LiveLayout title="Manage Products" privatePage><Notice {...profile} />{profile.data && !admin && <p role="alert">Administrator access is required.</p>}
    {admin && <><Notice {...products} /><Notice {...action} /><details><summary>Add a product</summary><form className="live-form" onSubmit={create}>
      {(['name', 'description', 'style', 'pattern', 'sizes', 'color', 'image_url'] as const).map((field) => <label key={field}>{field === 'image_url' ? 'Image URL or /clothes/ asset path' : field === 'sizes' ? 'Sizes separated by commas' : field[0].toUpperCase() + field.slice(1)}<input required value={draft[field]} onChange={(e) => setDraft({ ...draft, [field]: e.target.value })} /></label>)}
      <label>Clothing type<select value={draft.clothing_type} onChange={(e) => setDraft({ ...draft, clothing_type: e.target.value })}>{Object.keys(clothingKinds).map((type) => <option key={type}>{type}</option>)}</select></label>
      <label>Upload product photo (optional)<input type="file" accept="image/jpeg,image/png" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} /></label>
      <label>Price<input required type="number" min="0.01" step="0.01" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} /></label>
      <label>Stock per size<input required type="number" min="0" step="1" value={draft.stock} onChange={(e) => setDraft({ ...draft, stock: e.target.value })} /></label>
      <button className="button button-primary" disabled={action.busy}>Create product</button>
    </form></details><div className="live-form" style={{ maxWidth: 'none' }}>{products.data?.map((p) => <ProductEditor key={p.product_id} product={p} />)}</div></>}
  </LiveLayout>
}

export function LiveAdminOrders() {
  const profile = useAdmin()
  const admin = profile.data?.role === 'admin'
  const orders = useRemote(shopApi.adminOrders, 'admin-orders', admin)
  const action = useAction()
  return <LiveLayout title="Manage Orders" privatePage><Notice {...profile} /><Notice {...orders} /><Notice {...action} />
    {profile.data && !admin && <p role="alert">Administrator access is required.</p>}
    {admin && orders.data?.map((order) => <article className="live-card" key={order.order_id}>
      <h2>{formatMoney(Number(order.total_amount))} · {order.status}</h2><p>{order.order_id} · {new Date(order.created_at).toLocaleString()}</p>
      <p>{order.recipient_name} · {order.phone}<br />{order.delivery_address}</p>
      <ul>{order.order_items.map((item, i) => <li key={i}>{item.product_name} · {item.size} · {item.color} × {item.quantity}</li>)}</ul>
      <div className="live-controls"><label>Status<select value={order.status} disabled={action.busy} onChange={(e) => action.run(() => shopApi.updateOrder(order.order_id, e.target.value as OrderStatus, e.target.value === 'cancelled' ? false : order.is_paid))}>
        <option value={order.status}>{order.status}</option>{order.status === 'placed' && <><option value="shipped">shipped</option><option value="cancelled">cancelled</option></>}{order.status === 'shipped' && <option value="delivered">delivered</option>}
      </select></label><label className="live-check"><input type="checkbox" disabled={action.busy || order.status === 'cancelled'} checked={order.is_paid} onChange={(e) => action.run(() => shopApi.updateOrder(order.order_id, order.status, e.target.checked))} />Payment collected</label></div>
    </article>)}
    {admin && orders.data?.length === 0 && <p>No orders yet.</p>}
  </LiveLayout>
}
