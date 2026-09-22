import { useState, type ReactNode } from 'react'
import { useRemote } from './hooks'
import { Link, Navigate } from 'react-router-dom'
import { StorefrontHeader } from '../../components/layout/StorefrontHeader'
import { StorefrontFooter } from '../../components/layout/StorefrontFooter'
import { useSession } from '../auth/sessionContext'
import { shopApi } from '../../services/shopApi'
import '../products/styles/catalogue.css'
import './live.css'

export function Notice({ error, loading, message }: { error?: string; loading?: boolean; message?: string }) {
  return <>{loading && <p role="status">Loading…</p>}{error && <p className="live-error" role="alert">{error}</p>}{message && <p role="status">{message}</p>}</>
}

export function LiveLayout({ title, children, privatePage = false }: { title: string; children: ReactNode; privatePage?: boolean }) {
  const { session, loading } = useSession()
  const cart = useRemote(shopApi.cart, session?.user.id ?? 'guest', !!session)
  const [query, setQuery] = useState('')
  return <div className="storefront">
    <StorefrontHeader query={query} onSearch={setQuery} bagCount={cart.data?.reduce((sum, row) => sum + row.quantity, 0) ?? 0} contentId="live-content" />
    <main id="live-content" className="store-container live-page" tabIndex={-1}>
      <h1>{title}</h1>
      <nav className="live-links" aria-label="Your shopping pages"><Link to="/clothes">Clothes</Link><Link to="/wishlist">Wishlist</Link><Link to="/orders">Orders</Link><Link to="/profile">Account</Link></nav>
      {query.trim() && <p><Link to={`/clothes?q=${encodeURIComponent(query.trim())}`}>Search all clothes for “{query}”</Link></p>}
      {privatePage && loading ? <p role="status">Checking your session…</p> : privatePage && !session ?
        <Navigate to="/login" state={{ message: "Need to log in" }} replace /> : children}
    </main><StorefrontFooter />
  </div>
}

export function AccountGate({ children }: { children: ReactNode }) {
  const { session, loading } = useSession()
  if (loading) return <p role="status">Checking your session...</p>
  if (!session) return <Navigate to="/login" state={{ message: "Need to log in" }} replace />
  return <>{children}</>
}
