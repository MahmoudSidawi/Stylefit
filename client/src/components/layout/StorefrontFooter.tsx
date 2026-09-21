import { Link, useLocation } from 'react-router-dom'

export function StorefrontFooter() {
  const isCatalogue = useLocation().pathname === '/catalogue'
  return (
    <footer className="store-footer">
      <div className="store-container footer-grid">
        <div className="footer-about">
          <h2>StyleFit Studio</h2>
          <p>
            A considered wardrobe. A personal point of view. An editorial
            collective reimagining modern styling.
          </p>
          <label htmlFor="gazette">Boutique Gazette</label>
          <div className="newsletter">
            <input
              id="gazette"
              type="email"
              placeholder="Your maison email…"
              disabled
            />
            <button className="button button-primary" disabled>
              Subscribe
            </button>
          </div>
          <small>Newsletter subscriptions are coming soon.</small>
        </div>
        <div>
          <h3>Maison</h3>
          <Link to="/clothes">Atelier Collections</Link>
          <Link to="/matcher">Outfit Harmony Studio</Link>
          <Link to="/wardrobe">Digital Archive</Link>
          <a href={isCatalogue ? '#editorial' : '/catalogue#editorial'}>
            Our Editorial
          </a>
        </div>
        <div>
          <h3>Client Care</h3>
          <span>Garment Care · Soon</span>
          <span>Private Concierge · Soon</span>
          <span>Delivery & Returns · Soon</span>
          <span>Circular Materials · Soon</span>
        </div>
        <div>
          <h3>Ethics & AI</h3>
          <p>
            This is a frontend preview. Products and styling scores are sample
            data. No orders, payments, or AI processing take place.
          </p>
        </div>
      </div>
      <div className="store-container footer-bottom">
        <span>
          © {new Date().getFullYear()} StyleFit Studio. A new perspective on
          personal style.
        </span>
        <span>Paris · Milan · New York</span>
      </div>
    </footer>
  )
}
