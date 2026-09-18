import { NavLink, Outlet } from 'react-router-dom'

const links = [
  { to: '/', label: 'Home' },
  { to: '/catalogue', label: 'Catalogue' },
  { to: '/wardrobe', label: 'Wardrobe' },
  { to: '/matcher', label: 'Matcher' },
  { to: '/cart', label: 'Cart' },
  { to: '/wishlist', label: 'Wishlist' },
  { to: '/checkout', label: 'Checkout' },
  { to: '/orders', label: 'Orders' },
  { to: '/profile', label: 'Profile' },
  { to: '/login', label: 'Login' },
  { to: '/register', label: 'Register' },
  { to: '/admin/products', label: 'Admin products' },
  { to: '/admin/orders', label: 'Admin orders' },
]

export default function MainLayout() {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="site-header">
        <NavLink className="brand" to="/">StyleFit</NavLink>
        <nav aria-label="Main navigation">
          {links.map(({ to, label }) => (
            <NavLink key={to} to={to} end={to === '/'}>{label}</NavLink>
          ))}
        </nav>
      </header>
      <main id="main-content" tabIndex={-1}><Outlet /></main>
      <footer>AI Clothing Store and Clothes Matcher</footer>
    </>
  )
}

