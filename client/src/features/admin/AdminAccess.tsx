import { useState, type ReactNode } from 'react'
import { Link, NavLink, Navigate, useNavigate } from 'react-router-dom'
import { getAdminClient } from '../../services/supabase'
import { shopApi } from '../../services/shopApi'
import { useSession } from '../auth/sessionContext'
import { useAction, useRemote } from '../live/hooks'
import { Notice } from '../live/shared'
import { Icon } from '../../components/ui/Icon'
import './admin.css'

export function AdminLayout({ title, children }: { title: string; children: ReactNode }) {
  const { session, loading } = useSession()
  const profile = useRemote(shopApi.adminMe, session?.user.id ?? 'admin', !!session)
  const action = useAction()
  if (loading) return <p role="status">Checking administrator session...</p>
  if (!session) return <Navigate to="/admin/login" replace />
  return <div className="storefront admin-shell admin-dashboard">
    <aside className="admin-sidebar"><Link className="admin-brand" to="/admin/products"><span>sf.</span>StyleFit<small>ADMIN</small></Link>
      <p className="admin-nav-label">STORE MANAGEMENT</p><nav aria-label="Administration">
        <NavLink to="/admin/products"><Icon name="hanger" size={20} />Products</NavLink>
        <NavLink to="/admin/users"><Icon name="wardrobe" size={20} />Users</NavLink>
        <NavLink to="/admin/orders"><Icon name="bag" size={20} />Orders & payments</NavLink>
      </nav><div className="admin-sidebar-bottom"><Link to="/catalogue"><Icon name="arrow" size={18} />Visit storefront</Link><button disabled={action.busy} onClick={() => action.run(async () => { const { error } = await getAdminClient().auth.signOut(); if (error) throw error })}><Icon name="lock" size={18} />Sign out of admin</button><p>StyleFit management console</p></div>
    </aside>
    <div className="admin-body"><header className="admin-topbar"><span>Workspace <span>/</span> {title.replace('Manage ', '')}</span><div><span className="admin-avatar">AD</span><div><strong>{profile.data?.name || 'Administrator'}</strong><small>{session.user.email}</small></div></div></header>
      <main className="admin-main" id="admin-content"><div className="admin-page-heading"><div><span className="admin-eyebrow">YOUR STORE, AT A GLANCE</span><h1>{title}</h1><p>{title.includes('Products') ? 'Organize your catalogue, pricing and inventory.' : title.includes('Users') ? 'View your community and manage account details.' : 'Track deliveries and cash-on-delivery payments.'}</p></div><span className="admin-workspace-badge"><span />Admin workspace</span></div>
        <Notice {...action} /><Notice {...profile} />{profile.error && <button className="button button-surface" onClick={profile.reload}>Retry access check</button>}{profile.data?.role === 'admin' && children}
      </main><footer className="admin-footer">StyleFit Studio <span>Store administration</span></footer>
    </div>
  </div>
}

export function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const action = useAction()
  const navigate = useNavigate()
  return <div className="storefront admin-shell"><main className="admin-login live-card"><Link className="store-brand" to="/catalogue">StyleFit</Link>
    <p>STORE ADMINISTRATION</p><h1>Admin sign in</h1><p>Use your administrator email and password to manage the store.</p>
    <form className="live-form" onSubmit={(event) => { event.preventDefault(); void action.run(async () => {
      const client = getAdminClient()
      const { error } = await client.auth.signInWithPassword({ email: email.trim(), password })
      if (error) throw error
      try { await shopApi.adminMe() } catch (error) { await client.auth.signOut(); throw error }
      navigate('/admin/products', { replace: true })
    }) }}>
      <label>Admin email<input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
      <label>Admin password<input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
      <Notice {...action} /><button className="button button-primary" disabled={action.busy}>{action.busy ? 'Signing in...' : 'Sign in as admin'}</button>
    </form><p><Link to="/login">Customer sign in</Link></p></main></div>
}
