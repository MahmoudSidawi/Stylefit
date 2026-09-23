import { useState } from 'react'
import { useSession } from '../auth/sessionContext'
import { shopApi, type OrderStatus, type StoreProduct, type Variant } from '../../services/shopApi'
import { Notice } from './shared'
import { AdminLayout } from '../admin/AdminAccess'
import { useAction, useRemote } from './hooks'
import { clothingKinds } from './clothingKinds'
import { formatMoney } from '../../utils/currency'
import { Dialog } from '../../components/ui/Dialog'
import { Icon } from '../../components/ui/Icon'


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
  return <div className="admin-editor"><h3>{product.name} · {product.is_active ? 'Active' : 'Hidden'} · {product.product_variants.length} variants</h3>
    <form className="live-form" onSubmit={(e) => { e.preventDefault(); void action.run(() => shopApi.updateProduct(draft), 'Product saved.') }}>
      <label>Name<input required maxLength={120} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label>
      <label>Description<textarea maxLength={3000} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></label>
      <label>Clothing type<select value={draft.clothing_type} onChange={(e) => setDraft({ ...draft, clothing_type: e.target.value, category_id: clothingKinds[e.target.value as keyof typeof clothingKinds] })}>{Object.keys(clothingKinds).map((type) => <option key={type}>{type}</option>)}</select></label>
      <label>Style<input required value={draft.style} onChange={(e) => setDraft({ ...draft, style: e.target.value })} /></label>
      <label>Pattern<input required value={draft.pattern} onChange={(e) => setDraft({ ...draft, pattern: e.target.value })} /></label>
      <label className="live-check"><input type="checkbox" checked={draft.is_active} onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })} />Show in store</label>
      <button className="button button-primary" disabled={action.busy}>Save product</button><Notice {...action} />
    </form><h3>Size and color variants</h3>{product.product_variants.map((v) => <VariantEditor variant={v} key={v.variant_id} />)}
  </div>
}

function Stats({ items }: { items: { label: string; value: number | string; note: string }[] }) {
  return <div className="admin-stats">{items.map((item) => <article key={item.label}><span>{item.label}</span><strong>{item.value}</strong><small>{item.note}</small></article>)}</div>
}
function Pager({ page, total, onPage }: { page: number; total: number; onPage: (page: number) => void }) {
  return <div className="admin-pagination"><span>{total ? `${page * 10 + 1}-${Math.min((page + 1) * 10, total)} of ${total}` : '0 results'}</span><div><button disabled={page === 0} onClick={() => onPage(page - 1)}>Previous</button><span>Page {page + 1}</span><button disabled={(page + 1) * 10 >= total} onClick={() => onPage(page + 1)}>Next</button></div></div>
}

export function LiveAdminProducts() {
  const { session } = useSession()
  const products = useRemote(shopApi.adminProducts, `admin-products:${session?.user.id}`, !!session)
  const action = useAction()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(0)
  const [editing, setEditing] = useState<StoreProduct | null>(null)
  const [adding, setAdding] = useState(false)
  const initial = { name: '', description: '', clothing_type: 't-shirts', style: 'casual', pattern: 'solid', sizes: '', color: '', price: '', stock: '', image_url: '' }
  const [draft, setDraft] = useState(initial)
  const [photo, setPhoto] = useState<File | null>(null)
  const all = products.data ?? []
  const filtered = all.filter((product) => `${product.name} ${product.clothing_type}`.toLowerCase().includes(query.toLowerCase()) && (status === 'all' || product.is_active === (status === 'active')))
  const currentPage = Math.min(page, Math.max(0, Math.ceil(filtered.length / 10) - 1))
  async function create(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const success = await action.run(async () => {
      const sizes = [...new Set(draft.sizes.split(',').map((size) => size.trim()).filter(Boolean))]
      if (!sizes.length) throw new Error('Enter at least one size.')
      const imageUrl = photo ? (await shopApi.uploadProductImage(photo)).image_url : draft.image_url
      if (!imageUrl) throw new Error('Upload a product photo or enter its URL.')
      await shopApi.createProduct({ name: draft.name, description: draft.description, clothing_type: draft.clothing_type,
        category_id: clothingKinds[draft.clothing_type as keyof typeof clothingKinds], style: draft.style, pattern: draft.pattern, is_active: true,
        variants: sizes.map((size) => ({ size, color: draft.color, price: Number(draft.price), stock_quantity: Number(draft.stock), image_url: imageUrl, is_active: true })) })
      setDraft(initial); setPhoto(null)
    }, 'Product and variants created.')
    if (success) setAdding(false)
  }
  return <AdminLayout title="Manage Products">
    <Stats items={[{ label: 'Total products', value: all.length, note: 'Across your catalogue' }, { label: 'Active products', value: all.filter((p) => p.is_active).length, note: 'Visible in the storefront' }, { label: 'Units in stock', value: all.reduce((sum, p) => sum + p.product_variants.reduce((n, v) => n + v.stock_quantity, 0), 0), note: 'Across all sizes and colors' }]} />
    <Notice {...products} />{products.error && <button className="button button-surface" onClick={products.reload}>Retry products</button>}<Notice {...action} />
    <section className="admin-table-card"><div className="admin-table-heading"><div><h2>Product catalogue</h2><p>Manage every piece in your collection.</p></div><button className="button button-primary" onClick={() => setAdding(true)}><Icon name="plus" size={17} />Add product</button></div>
      <div className="admin-toolbar"><label className="admin-search"><Icon name="search" size={17} /><input type="search" aria-label="Search products" placeholder="Search by name or clothing type..." value={query} onChange={(e) => { setQuery(e.target.value); setPage(0) }} /></label><select aria-label="Filter product status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(0) }}><option value="all">All statuses</option><option value="active">Active</option><option value="hidden">Hidden</option></select></div>
      <div className="admin-table-scroll" tabIndex={0} role="region" aria-label="Product catalogue table"><table className="admin-table"><thead><tr><th scope="col">Product</th><th scope="col">Category</th><th scope="col">Price</th><th scope="col">Inventory</th><th scope="col">Status</th><th scope="col">Actions</th></tr></thead><tbody>
      {filtered.slice(currentPage * 10, currentPage * 10 + 10).map((product) => <tr key={product.product_id}><td><div className="admin-product-cell">{product.product_variants[0]?.image_url && <img src={product.product_variants[0].image_url} alt="" />}<div><strong>{product.name}</strong><small>{product.product_variants.length} variants</small></div></div></td><td className="admin-capitalize">{product.clothing_type}</td><td>{product.product_variants.length ? formatMoney(Math.min(...product.product_variants.map((v) => Number(v.price)))) : '--'}</td><td>{product.product_variants.reduce((sum, variant) => sum + variant.stock_quantity, 0)} <small>units</small></td><td><span className={`admin-status ${product.is_active ? 'positive' : 'neutral'}`}>{product.is_active ? 'Active' : 'Hidden'}</span></td><td><button className="admin-edit-button" aria-label={`Edit ${product.name}`} onClick={() => setEditing(product)}><Icon name="edit" size={15} />Edit</button></td></tr>)}
      {!products.loading && !filtered.length && <tr><td colSpan={6} className="admin-empty">No products match your filters.</td></tr>}
      </tbody></table></div><Pager page={currentPage} total={filtered.length} onPage={setPage} />
    </section>
    {adding && <Dialog title="Add product" onClose={() => { if (!action.busy) setAdding(false) }} wide><div className="admin-editor"><Notice {...action} /><form className="live-form" onSubmit={create}>
      {(['name', 'description', 'style', 'pattern', 'sizes', 'color', 'image_url'] as const).map((field) => <label key={field}>{field === 'image_url' ? 'Image URL' : field === 'sizes' ? 'Sizes separated by commas' : field[0].toUpperCase() + field.slice(1)}<input required={field !== 'image_url' || !photo} value={draft[field]} onChange={(e) => setDraft({ ...draft, [field]: e.target.value })} /></label>)}
      <label>Clothing type<select value={draft.clothing_type} onChange={(e) => setDraft({ ...draft, clothing_type: e.target.value })}>{Object.keys(clothingKinds).map((type) => <option key={type}>{type}</option>)}</select></label>
      <label>Upload product photo (optional)<input type="file" accept="image/jpeg,image/png" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} /></label>
      <label>Price<input required type="number" min="0.01" step="0.01" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} /></label>
      <label>Stock per size<input required type="number" min="0" step="1" value={draft.stock} onChange={(e) => setDraft({ ...draft, stock: e.target.value })} /></label>
      <button className="button button-primary" disabled={action.busy}>Create product</button>
    </form></div></Dialog>}
    {editing && <Dialog title="Edit product" onClose={() => setEditing(null)} wide><ProductEditor product={editing} /></Dialog>}
  </AdminLayout>
}
type AdminAccount = { user_id: string; name: string; email: string; role: string }
function UserEditor({ user }: { user: AdminAccount }) {
  const [name, setName] = useState(user.name)
  const action = useAction()
  return <div className="admin-editor"><p className="admin-editor-description">{user.email}</p><form className="live-form" onSubmit={(event) => { event.preventDefault(); void action.run(() => shopApi.updateUser(user.user_id, name.trim()), 'Customer name saved.') }}>
    <label>Full name<input required maxLength={120} value={name} onChange={(event) => setName(event.target.value)} /></label><Notice {...action} /><button className="button button-primary" disabled={action.busy || !name.trim()}>Save name</button>
  </form></div>
}
export function LiveAdminUsers() {
  const { session } = useSession()
  const users = useRemote(shopApi.adminUsers, `admin-users:${session?.user.id}`, !!session)
  const [query, setQuery] = useState('')
  const [role, setRole] = useState('all')
  const [page, setPage] = useState(0)
  const [editing, setEditing] = useState<AdminAccount | null>(null)
  const all = users.data ?? []
  const filtered = all.filter((user) => `${user.name} ${user.email}`.toLowerCase().includes(query.toLowerCase()) && (role === 'all' || user.role === role))
  const currentPage = Math.min(page, Math.max(0, Math.ceil(filtered.length / 10) - 1))
  return <AdminLayout title="Manage Users"><Stats items={[{ label: 'Total accounts', value: all.length, note: 'Your StyleFit community' }, { label: 'Customers', value: all.filter((u) => u.role === 'customer').length, note: 'Registered shoppers' }, { label: 'Administrators', value: all.filter((u) => u.role === 'admin').length, note: 'Store management access' }]} /><Notice {...users} />{users.error && <button className="button button-surface" onClick={users.reload}>Retry users</button>}
    <section className="admin-table-card"><div className="admin-table-heading"><div><h2>User directory</h2><p>Account details, all in one place.</p></div><span className="admin-count">{all.length} accounts</span></div>
      <div className="admin-toolbar"><label className="admin-search"><Icon name="search" size={17} /><input aria-label="Search users" type="search" placeholder="Search by name or email..." value={query} onChange={(event) => { setQuery(event.target.value); setPage(0) }} /></label><select aria-label="Filter account role" value={role} onChange={(e) => { setRole(e.target.value); setPage(0) }}><option value="all">All roles</option><option value="customer">Customers</option><option value="admin">Administrators</option></select></div>
      <div className="admin-table-scroll" tabIndex={0} role="region" aria-label="User directory table"><table className="admin-table"><thead><tr><th scope="col">User</th><th scope="col">Email address</th><th scope="col">Role</th><th scope="col">Account ID</th><th scope="col">Actions</th></tr></thead><tbody>
        {filtered.slice(currentPage * 10, currentPage * 10 + 10).map((user) => <tr key={user.user_id}><td><div className="admin-product-cell"><span className="admin-user-initial">{user.name.slice(0, 1).toUpperCase()}</span><strong>{user.name}</strong></div></td><td>{user.email}</td><td><span className={`admin-status ${user.role === 'admin' ? 'purple' : 'neutral'}`}>{user.role}</span></td><td><span className="admin-id" title={user.user_id}>{user.user_id.slice(0, 8)}</span></td><td><button className="admin-edit-button" aria-label={`Edit ${user.name}`} onClick={() => setEditing(user)}><Icon name="edit" size={15} />Edit</button></td></tr>)}
        {!users.loading && !filtered.length && <tr><td colSpan={5} className="admin-empty">No users match your filters.</td></tr>}
      </tbody></table></div><Pager page={currentPage} total={filtered.length} onPage={setPage} />
    </section>{editing && <Dialog title="Edit account" onClose={() => setEditing(null)}><UserEditor user={editing} /></Dialog>}
  </AdminLayout>
}
export function LiveAdminOrders() {
  const { session } = useSession()
  const orders = useRemote(shopApi.adminOrders, `admin-orders:${session?.user.id}`, !!session)
  const action = useAction()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const all = orders.data ?? []
  const filtered = all.filter((order) => `${order.order_id} ${order.recipient_name ?? ''} ${order.status}`.toLowerCase().includes(query.toLowerCase()))
  const currentPage = Math.min(page, Math.max(0, Math.ceil(filtered.length / 10) - 1))
  return <AdminLayout title="Manage Orders"><Stats items={[{ label: 'Total orders', value: all.length, note: 'Across your store' }, { label: 'Awaiting delivery', value: all.filter((o) => ['placed', 'shipped'].includes(o.status)).length, note: 'Placed or shipped' }, { label: 'Payments collected', value: formatMoney(all.filter((o) => o.is_paid).reduce((sum, o) => sum + Number(o.total_amount), 0)), note: 'Cash on delivery' }]} /><Notice {...orders} />{orders.error && <button className="button button-surface" onClick={orders.reload}>Retry orders</button>}<Notice {...action} />
    <section className="admin-table-card"><div className="admin-table-heading"><div><h2>Orders & payments</h2><p>Review purchases and update delivery progress.</p></div></div><div className="admin-toolbar"><label className="admin-search"><Icon name="search" size={17} /><input aria-label="Search orders" type="search" placeholder="Search orders, customers or status..." value={query} onChange={(event) => { setQuery(event.target.value); setPage(0) }} /></label></div>
      <div className="admin-table-scroll" tabIndex={0} role="region" aria-label="Orders table"><table className="admin-table"><thead><tr><th scope="col">Order</th><th scope="col">Customer & items</th><th scope="col">Total</th><th scope="col">Status</th><th scope="col">Payment</th></tr></thead><tbody>
      {filtered.slice(currentPage * 10, currentPage * 10 + 10).map((order) => <tr key={order.order_id}><td><strong title={order.order_id}>#{order.order_id.slice(0, 8)}</strong><small className="admin-block">{new Date(order.created_at).toLocaleDateString()}</small></td><td><strong>{order.recipient_name || 'Customer'}</strong><details className="admin-order-details"><summary>{order.order_items.length} items / Delivery details</summary><p>{order.phone}<br />{order.delivery_address}</p><ul>{order.order_items.map((item, i) => <li key={i}>{item.product_name} / {item.size} / {item.color} x {item.quantity}</li>)}</ul></details></td><td>{formatMoney(Number(order.total_amount))}</td><td><select aria-label={`Status for order ${order.order_id}`} value={order.status} disabled={action.busy} onChange={(e) => action.run(() => shopApi.updateOrder(order.order_id, e.target.value as OrderStatus, e.target.value === 'cancelled' ? false : order.is_paid))}><option value={order.status}>{order.status}</option>{order.status === 'placed' && <><option value="shipped">shipped</option><option value="cancelled">cancelled</option></>}{order.status === 'shipped' && <option value="delivered">delivered</option>}</select></td><td><label className="admin-payment"><input type="checkbox" aria-label={`Payment collected for order ${order.order_id}`} disabled={action.busy || order.status === 'cancelled'} checked={order.is_paid} onChange={(e) => action.run(() => shopApi.updateOrder(order.order_id, order.status, e.target.checked))} />Collected</label></td></tr>)}
      {!orders.loading && !filtered.length && <tr><td colSpan={5} className="admin-empty">No orders match your search.</td></tr>}
      </tbody></table></div><Pager page={currentPage} total={filtered.length} onPage={setPage} />
    </section>
  </AdminLayout>
}
