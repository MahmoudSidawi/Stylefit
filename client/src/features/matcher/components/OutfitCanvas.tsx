import { Icon } from '../../../components/ui/Icon'
import { slotLabels } from '../data/garments'
import type { Garment } from '../types'

type Props = {
  busy?: boolean
  selected: { garment: Garment; size: string }[]
  name: string
  total: number
  storeCount: number
  onRemove: (id: string) => void
  onSize: (id: string, size: string) => void
  onCheck: () => void
  onClear: () => void
  onReset: () => void
  onSave: () => void
  onAddBag: () => void
  onAccessories: () => void
}

export function OutfitCanvas({
  busy = false,
  selected,
  name,
  total,
  storeCount,
  onRemove,
  onSize,
  onCheck,
  onClear,
  onReset,
  onSave,
  onAddBag,
  onAccessories,
}: Props) {
  return (
    <section className="canvas-column" aria-labelledby="canvas-title">
      <div className="outfit-canvas">
        <div className="canvas-heading">
          <div>
            <span className="overline">Active moodboard</span>
            <h2 id="canvas-title">{name}</h2>
          </div>
          <div className="canvas-tools">
            <button
              className="button button-primary"
              disabled={busy || selected.length < 2}
              onClick={onCheck}
            >
              <Icon name="sparkles" size={16} /> {busy ? 'Checking...' : 'Check outfit with AI'}
            </button>
            <button
              className="icon-button"
              aria-label="Clear canvas"
              disabled={!selected.length}
              onClick={onClear}
            >
              <Icon name="reset" size={17} />
            </button>
          </div>
        </div>
        <div className="staged-grid">
          {selected.map(({ garment, size }, index) => (
            <article className="staged-card" key={garment.id}>
              <div className="staged-image">
                <img src={garment.detailImage} alt={garment.name} />
                <button
                  className="icon-button"
                  aria-label={`Remove ${garment.name} from canvas`}
                  onClick={() => onRemove(garment.id)}
                >
                  <Icon name="close" size={15} />
                </button>
                <span>
                  Slot {String(index + 1).padStart(2, '0')}:{' '}
                  {slotLabels[garment.slot]}
                </span>
              </div>
              <div className="staged-brand">
                <span>
                  {garment.brand.replace(
                    'Sample Personal Archive',
                    'Sample Archive',
                  )}
                </span>
                <strong>
                  {garment.source === 'store'
                    ? `$${garment.price}`
                    : garment.sample === false
                      ? 'Owned'
                      : 'Owned · Demo'}
                </strong>
              </div>
              <h3>{garment.name}</h3>
              <p className="staged-material">{garment.material}</p>
              <label className="staged-size">
                <span>Size</span>
                <select
                  aria-label={`Size for ${garment.name}`}
                  value={size}
                  onChange={(event) => onSize(garment.id, event.target.value)}
                >
                  {garment.sizes.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
                <span>
                  {garment.drape === 'structured'
                    ? 'Low Flow'
                    : garment.drape === 'fluid'
                      ? 'Pure Drape'
                      : 'Soft Texture'}
                </span>
              </label>
            </article>
          ))}
        </div>
        {!selected.length && (
          <div className="canvas-empty">
            <Icon name="hanger" size={40} />
            <h3>Your next look starts here.</h3>
            <p>
              Add two or three pieces from the Source Archive to compose your look.
            </p>
            <button className="button button-surface" onClick={onReset}>
              Start fresh
            </button>
          </div>
        )}
        <div className="canvas-summary">
          <div>
            <span className="overline">
              Curated total ({selected.length} pieces)
            </span>
            <strong>${total.toLocaleString('en-US')}</strong>
            <small>
              {storeCount} store {storeCount === 1 ? 'piece' : 'pieces'} ·{' '}
              {selected.length - storeCount} owned
            </small>
          </div>
          <div className="canvas-summary-actions">
            <button
              className="button button-surface"
              disabled={!selected.length}
              onClick={onSave}
            >
              <Icon name="bookmark" size={16} /> Save Look
            </button>
            <button
              className="button button-primary"
              disabled={busy || !storeCount}
              onClick={onAddBag}
            >
              <Icon name="bag" size={16} /> Add Look to Bag
            </button>
          </div>
        </div>
        <p className="canvas-caption">
          Prices in USD. Only store pieces are added to your bag.
        </p>
      </div>
      <div className="tone-palette">
        <span className="overline">
          Tone
          <br />
          Palette
        </span>
        <div className="tone-swatches">
          {selected.map(({ garment }) => (
            <span
              key={garment.id}
              style={{ backgroundColor: garment.color }}
              title={garment.colorName}
              aria-label={garment.colorName}
            />
          ))}
        </div>
        <p>
          {selected.length
            ? 'A study in texture & tone'
            : 'Build your own color story'}
        </p>
        <button onClick={onAccessories}>
          Explore dresses <Icon name="arrow" size={16} />
        </button>
      </div>
    </section>
  )
}
