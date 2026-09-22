import { Link } from 'react-router-dom'
import { Icon } from '../../../components/ui/Icon'
import { kinds } from '../data/options'
import type { WardrobeItem } from '../types'

export function WardrobeOverview({
  items,
  onAdd,
  onDrop,
}: {
  items: WardrobeItem[]
  onAdd: () => void
  onDrop: (files: FileList) => void
}) {
  const groups = [{ id: 'tops', label: 'Tops' }, { id: 'bottoms', label: 'Bottoms' }, { id: 'dresses', label: 'Dresses' }]
  const localCount = items.filter((item) => !item.sample).length
  return (
    <>
      <section className="wardrobe-stats" aria-label="Wardrobe composition">
        {groups.map((group) => (
          <div key={group.id}>
            <div>
              <strong>
                {
                  items.filter((item) => kinds[item.kind].category === group.id)
                    .length
                }
              </strong>
              <span>Pieces</span>
            </div>
            <p>{group.label}</p>
          </div>
        ))}
      </section>
      <div className="wardrobe-features">
        <section
          className="wardrobe-insight"
          aria-labelledby="wardrobe-insight-title"
        >
          <span className="overline">
            <Icon name="sparkles" size={16} /> The considered closet · An
            editorial thought
          </span>
          <h2 id="wardrobe-insight-title">
            The pieces you already love.
            <br />
            The combinations you haven’t tried.
          </h2>
          <p>
            A little structure, a softer texture, an unexpected color. Bring a
            favorite from your wardrobe into the studio and explore it alongside
            our atelier collection.
          </p>
          <div className="wardrobe-insight-footer">
            <div>
              <span className="insight-icon">
                <Icon name="hanger" size={24} />
              </span>
              <div>
                <span>Your personal edit</span>
                <strong>
                  {localCount
                    ? `${localCount} ${localCount === 1 ? 'piece' : 'pieces'} added by you`
                    : 'A fresh perspective'}
                </strong>
              </div>
            </div>
            <Link to="/catalogue">
              Explore the collection <Icon name="arrow" size={17} />
            </Link>
          </div>
          <Icon name="sparkles" size={170} />
        </section>
        <section
          className="wardrobe-photo-drop"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault()
            onDrop(event.dataTransfer.files)
          }}
          aria-labelledby="photo-drop-title"
        >
          <span className="overline">
            <Icon name="camera" size={16} /> A portrait of your wardrobe
          </span>
          <h2 id="photo-drop-title">Make room for your favorites</h2>
          <p>
            Photograph a garment in natural light, add a few details, and keep
            it in your private wardrobe.
          </p>
          <button className="photo-drop-button" onClick={onAdd}>
            <span>
              <Icon name="upload" size={17} /> Add a garment photo
            </span>
            <Icon name="plus" size={16} />
          </button>
          <span className="photo-drop-hint">
            Or drop one photo here · JPG or PNG · 5 MB
          </span>
        </section>
      </div>
    </>
  )
}
