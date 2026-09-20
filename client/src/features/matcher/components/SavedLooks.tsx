import { useState } from 'react'
import { Dialog } from '../../../components/ui/Dialog'
import { Icon } from '../../../components/ui/Icon'
import { getGarment, occasionLabels } from '../data/garments'
import type { SavedLook } from '../types'

export function SaveLookDialog({
  initialName,
  atLimit,
  onSave,
  onClose,
}: {
  initialName: string
  atLimit: boolean
  onSave: (name: string) => void
  onClose: () => void
}) {
  const [name, setName] = useState(initialName)
  const [error, setError] = useState('')
  return (
    <Dialog title="Keep this composition" onClose={onClose}>
      <p className="dialog-intro">
        Save this look in this browser, including your selected sizes and
        occasion.
      </p>
      <form
        className="save-look-form"
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          if (name.trim().length < 3) {
            setError('Give your look a name with at least 3 characters.')
            return
          }
          if (atLimit) return
          onSave(name.trim())
        }}
      >
        <label htmlFor="look-name">Look name</label>
        <input
          id="look-name"
          value={name}
          maxLength={60}
          aria-invalid={!!error}
          aria-describedby={error ? 'look-name-error' : undefined}
          onChange={(event) => {
            setName(event.target.value)
            setError('')
          }}
        />
        {error && (
          <p id="look-name-error" className="field-error" role="alert">
            {error}
          </p>
        )}
        {atLimit && (
          <p className="field-error" role="alert">
            You’ve saved 20 looks. Remove one from Saved Looks before saving
            another.
          </p>
        )}
        <button
          className="button button-primary"
          disabled={atLimit}
          type="submit"
        >
          <Icon name="bookmark" /> Save to this browser
        </button>
      </form>
    </Dialog>
  )
}

export function SavedLooksDialog({
  looks,
  onLoad,
  onRemove,
  onClose,
}: {
  looks: SavedLook[]
  onLoad: (look: SavedLook) => void
  onRemove: (id: string) => void
  onClose: () => void
}) {
  return (
    <Dialog title="Your saved looks" onClose={onClose}>
      <p className="dialog-intro">
        Stored locally in this browser. Loading a look replaces the current
        canvas.
      </p>
      {!looks.length ? (
        <div className="empty-bag">
          <Icon name="bookmark" size={32} />
          <h3>A collection of your own.</h3>
          <p>Compose a look and select Save Look to keep it here.</p>
        </div>
      ) : (
        <ul className="saved-look-list">
          {looks.map((look) => (
            <li key={look.id}>
              <div className="saved-look-thumbnails">
                {look.selection.slice(0, 3).map((entry) => (
                  <img
                    src={getGarment(entry.garmentId)?.image}
                    key={entry.garmentId}
                    alt=""
                  />
                ))}
              </div>
              <div>
                <h3>{look.name}</h3>
                <p>
                  {look.selection.length} pieces ·{' '}
                  {occasionLabels[look.occasion]}
                </p>
                <div className="saved-look-actions">
                  <button
                    className="button button-lavender"
                    onClick={() => onLoad(look)}
                  >
                    Load look<span className="sr-only"> {look.name}</span>
                  </button>
                  <button
                    className="text-button"
                    onClick={() => onRemove(look.id)}
                  >
                    Delete<span className="sr-only"> {look.name}</span>
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  )
}
