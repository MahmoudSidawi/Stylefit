import { useState, type ReactNode } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { StorefrontHeader } from '../components/layout/StorefrontHeader'
import { StorefrontFooter } from '../components/layout/StorefrontFooter'
import { Icon } from '../components/ui/Icon'
import { AccountGate } from '../features/live/shared'
import { useRemote, useAction } from '../features/live/hooks'
import { useSession } from '../features/auth/sessionContext'
import { getSupabaseClient } from '../services/supabase'
import { shopApi, type Profile } from '../services/shopApi'
import { useAccountProfile } from '../features/auth/useAccountProfile'
import '../features/products/styles/catalogue.css'
import './profile.css'

export function AccountLayout({ title, description, profile: providedProfile, children }: {
  title: string; description: string; profile?: Profile | null; children: ReactNode
}) {
  const { session } = useSession()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const cart = useRemote(shopApi.cart, session?.user.id ?? 'guest', !!session)
  const account = useAccountProfile(session?.user.id, providedProfile === undefined)
  const profile = providedProfile ?? account.data
  const action = useAction()
  async function signOut() {
    await action.run(async () => {
      const { error } = await getSupabaseClient().auth.signOut()
      if (error) throw error
      navigate('/catalogue', { replace: true })
    })
  }
  const initials = (profile?.name || session?.user.email || 'You').split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
  return <div className="storefront profile-page">
    <StorefrontHeader query={query} onSearch={setQuery} bagCount={cart.data?.reduce((sum, item) => sum + item.quantity, 0) ?? 0} contentId="profile-content" />
    <main id="profile-content" className="profile-container" tabIndex={-1}>
      <div className="profile-heading"><div><span className="profile-eyebrow">YOUR STYLEFIT SPACE</span><h1>{title}</h1><p>{description}</p></div><Link to="/catalogue">Back to the collection <Icon name="arrow" size={16} /></Link></div>
      {query.trim() && <p className="profile-notice"><Link to={`/clothes?q=${encodeURIComponent(query.trim())}`}>Search clothes for &ldquo;{query}&rdquo;</Link></p>}
      <AccountGate><div className="profile-layout">
        <aside className="profile-sidebar">
          <div className="profile-identity"><span className="profile-avatar" aria-hidden="true">{initials}</span><h2>{profile?.name || 'Welcome back'}</h2><p>{session?.user.email}</p><span className="profile-member">{profile?.role === 'admin' ? 'Administrator' : 'StyleFit member'}</span></div>
          <nav aria-label="Account navigation">
            <NavLink to="/profile"><Icon name="edit" size={18} />Personal details</NavLink>
            <NavLink to="/orders"><Icon name="bag" size={18} />My orders<Icon name="arrow" size={15} /></NavLink>
            <NavLink to="/wishlist"><Icon name="heart" size={18} />Saved favorites<Icon name="arrow" size={15} /></NavLink>
            <NavLink to="/wardrobe"><Icon name="wardrobe" size={18} />My wardrobe<Icon name="arrow" size={15} /></NavLink>
            {profile?.role === 'admin' && <NavLink to="/admin/login"><Icon name="lock" size={18} />Admin dashboard<Icon name="arrow" size={15} /></NavLink>}
          </nav>
          <button className="profile-signout" onClick={signOut} disabled={action.busy}>Sign out <Icon name="arrow" size={16} /></button>
        </aside>
        <div className="profile-main">
          {cart.error && <p role="alert" className="profile-notice profile-error">Your bag count could not be updated. <button className="text-button" onClick={cart.reload}>Retry bag count</button></p>}
          {action.error && <p role="alert" className="profile-notice profile-error">{action.error}</p>}
          {account.error && providedProfile === undefined && <p role="alert" className="profile-notice profile-error">{account.error} <button className="text-button" onClick={account.reload}>Retry account details</button></p>}
          {children}
        </div>
      </div></AccountGate>
    </main><StorefrontFooter />
  </div>
}
