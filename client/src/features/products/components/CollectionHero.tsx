import { Icon } from '../../../components/ui/Icon'
import { Link } from 'react-router-dom'
import type { StorefrontContent } from '../../../services/shopApi'

export function CollectionHero({ count, content }: { count: number; content: StorefrontContent }) {
  return (
    <section className="collection-hero" aria-labelledby="collection-title">
      <div className="hero-copy">
        <span className="eyebrow-pill">
          <Icon name="sparkles" size={13} /> A considered approach to style
        </span>
        <div>
          <p className="overline">{content.subtitle}</p>
          <h1 id="collection-title">{content.title}</h1>
        </div>
        <p className="hero-description">
          {content.description}
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
            src={content.hero_image}
            alt={content.hero_alt}
            fetchPriority="high"
          />
          <span className="image-caption">
            <i /> Spring tailoring, reimagined
          </span>
        </div>
        <div className="hero-aside">
          <img
            src={content.detail_image}
            alt={content.detail_alt}
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
