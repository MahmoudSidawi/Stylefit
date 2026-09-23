import { Icon } from '../../../components/ui/Icon'
import type { StorefrontContent } from '../../../services/shopApi'

export function Editorial({ content }: { content: StorefrontContent }) {
  return (
    <>
      <section className="sizing-banner" aria-labelledby="sizing-title">
        <div>
          <span className="overline">
            <Icon name="ruler" size={15} /> Atelier sizing intelligence
          </span>
          <h2 id="sizing-title">Never second-guess your silhouette</h2>
          <p>
            Good style starts with how you feel. Explore the cut, fabric, and
            available sizes of each piece to find your next wardrobe favorite.
          </p>
          <div className="sizing-footnote">
            <span className="initials">AI</span>
            <span className="initials">FR</span>
            <span className="initials">3D</span>
            <span>Personalized sizing is coming in a future release.</span>
          </div>
        </div>
        <div className="sizing-actions">
          <div className="profile-card">
            <span className="overline">Your fit profile</span>
            <strong>A fresh canvas</strong>
            <span>Your measurements, your choice</span>
          </div>
          <button className="button button-primary" disabled>
            <Icon name="ruler" /> Sizing · Coming soon
          </button>
        </div>
      </section>
      <section
        className="editorial-section"
        id="editorial"
        aria-labelledby="editorial-title"
      >
        <div className="editorial-copy">
          <span className="overline">Curator’s Manifesto</span>
          <h2 id="editorial-title">
            {content.editorial_title}
          </h2>
          <p>
            {content.editorial_description}
          </p>
          <div className="curator">
            <img
              src={content.curator_image}
              alt="Black and white portrait from the collection’s editorial"
              loading="lazy"
            />
            <div>
              <strong>The StyleFit Edit</strong>
              <span>A study in texture, form &amp; personal style</span>
            </div>
          </div>
        </div>
        <div className="editorial-images">
          <img
            src={content.atelier_image}
            alt="A fashion atelier with a dress form, fabric swatches, and a moodboard"
            loading="lazy"
          />
          <img
            src={content.tailoring_image}
            alt="Close-up of a tailored blazer’s lining, seams, and horn buttons"
            loading="lazy"
          />
        </div>
      </section>
      <div className="collection-end">
        <span>Capsule No. 04</span>
        <span>Considered pieces. Endless possibilities.</span>
        <a href="#collection">
          Back to collection <Icon name="arrow" size={16} />
        </a>
      </div>
    </>
  )
}
