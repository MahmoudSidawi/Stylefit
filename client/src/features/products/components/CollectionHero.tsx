import { Icon } from '../../../components/ui/Icon'
import { Link } from 'react-router-dom'
import hero from '../../../assets/storefront/hero.jpg'
import detail from '../../../assets/storefront/silk-detail.jpg'

export function CollectionHero({ count = 24 }: { count?: number }) {
  return (
    <section className="collection-hero" aria-labelledby="collection-title">
      <div className="hero-copy">
        <span className="eyebrow-pill">
          <Icon name="sparkles" size={13} /> A considered approach to style
        </span>
        <div>
          <p className="overline">Editorial Capsule No. 04</p>
          <h1 id="collection-title">Spring Architecture</h1>
        </div>
        <p className="hero-description">
          Sharp tailoring softens into fluid drape. Sculptural linen blazers,
          draped raw silks, and considered trousers for a wardrobe that feels
          entirely your own.
        </p>
        <div className="hero-actions">
          <Link className="button button-primary" to="/clothes">
            Shop All Clothes <Icon name="arrow" />
          </Link>
          <a className="button button-surface" href="#editorial">
            View Editorial Lookbook <Icon name="arrow" />
          </a>
        </div>
        <div className="hero-metrics">
          <div>
            <strong>Considered</strong>
            <span>Every detail, intentional</span>
          </div>
          <div>
            <strong>{count}</strong>
            <span>Everyday pieces</span>
          </div>
          <div>
            <strong>Yours</strong>
            <span>A personal point of view</span>
          </div>
        </div>
      </div>
      <div className="hero-montage">
        <div className="hero-image">
          <img
            src={hero}
            alt="Editorial model wearing a terracotta tailored suit in a sunlit studio"
            fetchPriority="high"
          />
          <span className="image-caption">
            <i /> Spring tailoring, reimagined
          </span>
        </div>
        <div className="hero-aside">
          <img
            src={detail}
            alt="Ivory raw silk with tortoiseshell buttons and delicate stitching"
          />
          <div className="match-tile">
            <Icon name="sparkles" size={24} />
            <div>
              <span className="overline">The styling edit</span>
              <strong>In harmony.</strong>
              <p>
                Thoughtful textures. Complementary tones. Effortless
                combinations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
