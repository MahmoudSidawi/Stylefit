import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Icon } from '../ui/Icon'

type Props = {
  query: string
  onSearch: (value: string) => void
  bagCount: number
  contentId?: string
  searchLabel?: string
}

export function StorefrontHeader({
  query,
  onSearch,
  bagCount,
  contentId = 'catalogue-content',
  searchLabel = 'Search garments',
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <>
      <a className="skip-link" href={`#${contentId}`}>
        Skip to content
      </a>
      <header className="store-header">
        <div className="header-inner">
          <Link
            className="store-brand"
            to="/catalogue"
            aria-label="StyleFit storefront"
          >
            <span className="brand-mark" aria-hidden="true">
              sf.
            </span>
            <span>StyleFit</span>
          </Link>
          <nav
            className={`store-navigation${menuOpen ? ' is-open' : ''}`}
            id="store-navigation"
            aria-label="Storefront navigation"
          >
            <NavLink to="/catalogue" onClick={() => setMenuOpen(false)}>
              Storefront
            </NavLink>
            <NavLink to="/matcher" onClick={() => setMenuOpen(false)}>
              AI Matcher
            </NavLink>
            <NavLink to="/wardrobe" onClick={() => setMenuOpen(false)}>
              Your Wardrobe
            </NavLink>
            <NavLink to="/cart" onClick={() => setMenuOpen(false)}>
              Bag ({bagCount})
            </NavLink>
            <span aria-disabled="true">
              Admin Console <small>Soon</small>
            </span>
          </nav>
          <div className="header-tools">
            <label className="search-field">
              <Icon name="search" size={16} />
              <span className="sr-only">{searchLabel}</span>
              <input
                type="search"
                placeholder="Search bespoke looks…"
                value={query}
                onChange={(event) => onSearch(event.target.value)}
              />
            </label>
            <span
              className="demo-avatar"
              title="Guest preview"
              aria-label="Guest preview"
            >
              G
            </span>
            <Link
              className="icon-button mobile-bag"
              aria-label={`Open shopping bag, ${bagCount} items`}
              to="/cart"
            >
              <Icon name="bag" />
              <span>{bagCount}</span>
            </Link>
            <button
              className="icon-button menu-toggle"
              aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
              aria-expanded={menuOpen}
              aria-controls="store-navigation"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <Icon name={menuOpen ? 'close' : 'menu'} />
            </button>
          </div>
        </div>
      </header>
    </>
  )
}
