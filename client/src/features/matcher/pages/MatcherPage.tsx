import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useSession } from '../../auth/sessionContext'
import { useRemote } from '../../live/hooks'
import { AccountGate, Notice } from '../../live/shared'
import { shopApi } from '../../../services/shopApi'
import { StorefrontHeader } from '../../../components/layout/StorefrontHeader'
import { StorefrontFooter } from '../../../components/layout/StorefrontFooter'
import { Icon } from '../../../components/ui/Icon'
import { SourceArchive } from '../components/SourceArchive'
import type { ArchiveFilter } from '../components/SourceArchive'
import { OutfitCanvas } from '../components/OutfitCanvas'
import { MatchInsights } from '../components/MatchInsights'
import { SaveLookDialog, SavedLooksDialog } from '../components/SavedLooks'
import { useOutfit } from '../hooks/useOutfit'
import { useSavedLooks } from '../hooks/useSavedLooks'
import { occasionLabels } from '../data/garments'
import type { ArchiveSource, Garment } from '../types'
import '../../products/styles/catalogue.css'
import '../styles/matcher.css'
import '../styles/workspace.css'

export default function MatcherPage() {
  const [params] = useSearchParams()
  const wardrobeId = params.get('wardrobe') ?? undefined
  return (
    <MatcherWorkspace key={wardrobeId ?? 'studio'} wardrobeId={wardrobeId} />
  )
}

function MatcherWorkspace({ wardrobeId }: { wardrobeId?: string }) {
  const outfit = useOutfit(wardrobeId)
  const { session } = useSession()
  const cart = useRemote(shopApi.cart, session?.user.id ?? 'guest', !!session)
  const navigate = useNavigate()
  const saved = useSavedLooks(session?.user.id ?? 'guest')
  const [mobilePanel, setMobilePanel] = useState<'clothes' | 'results'>('clothes')
  const [query, setQuery] = useState('')
  const [source, setSource] = useState<ArchiveSource>('store')
  const [filter, setFilter] = useState<ArchiveFilter>('all')
  const [dialog, setDialog] = useState<'save' | 'saved' | 'bag' | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    document.title = 'Outfit Harmony Studio — StyleFit'
    return () => {
      document.title = 'StyleFit'
    }
  }, [])
  useEffect(() => {
    if (!message) return
    const timeout = window.setTimeout(() => setMessage(''), 5000)
    return () => window.clearTimeout(timeout)
  }, [message])

  function stage(garment: Garment) {
    outfit.stage(garment)
    setMessage(`${garment.name} is on your canvas.`)
  }
  async function addLookToBag() {
    if (await outfit.addToBag()) navigate('/cart')
  }

  return (
    <div className="storefront matcher-page">
      <StorefrontHeader
        query={query}
        onSearch={setQuery}
        bagCount={cart.data?.reduce((sum, item) => sum + item.quantity, 0) ?? 0}

        contentId="matcher-content"
        searchLabel="Search source archive"
      />
      <main id="matcher-content" className="store-main" tabIndex={-1}>
        <section className="studio-intro">
          <div className="studio-container studio-intro-inner">
            <div>
              <div className="studio-eyebrow">
                <span>YOUR PERSONAL STYLING ROOM</span>

              </div>
              <h1>Fitting Engine</h1>
              <p>
                Choose your clothes. Build a look. Find what works together.
              </p>
            </div>
            <div className="studio-settings">
              <label><input type="checkbox" checked={outfit.includeProfile} onChange={(event) => outfit.setIncludeProfile(event.target.checked)} /> Include saved profile in AI analysis</label>
              <button
                className="saved-looks-trigger"
                onClick={() => setDialog('saved')}
              >
                <Icon name="bookmark" size={15} /> Saved Looks (
                {saved.looks.length})
              </button>
              <label>
                Occasion:
                <select
                  aria-label="Outfit occasion"
                  value={outfit.occasion}
                  onChange={(event) => {
                    const value = event.target.value
                    if (
                      value === 'evening' ||
                      value === 'work' ||
                      value === 'weekend'
                    )
                      outfit.setOccasion(value)
                  }}
                >
                  {Object.entries(occasionLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </section>
        <div className="studio-container"><Notice loading={outfit.loading} error={outfit.error} /></div>
        <AccountGate><div className="studio-container mobile-workspace-switch" role="group" aria-label="Fitting workspace panels">
          <button aria-pressed={mobilePanel === 'clothes'} onClick={() => setMobilePanel('clothes')}>Choose clothes</button>
          <button aria-pressed={mobilePanel === 'results'} onClick={() => setMobilePanel('results')}>AI results{outfit.result ? ` / ${outfit.result.score}%` : ''}</button>
        </div><div className={`studio-container studio-workspace mobile-panel-${mobilePanel}`}>

          <SourceArchive
            garments={outfit.garments}
            source={source}
            setSource={setSource}
            filter={filter}
            setFilter={setFilter}
            query={query}
            onClearSearch={() => setQuery('')}
            selection={outfit.selection}
            onStage={stage}
          />
          <OutfitCanvas
            busy={outfit.busy}
            selected={outfit.selected}
            name={outfit.name}
            total={outfit.total}
            storeCount={outfit.storePieces.length}
            onRemove={outfit.remove}
            onSize={outfit.changeSize}
            onCheck={async () => { if (await outfit.checkMatch()) setMobilePanel('results') }}
            onClear={outfit.clear}
            onSave={() => setDialog('save')}
            onAddBag={addLookToBag}
          />
          <MatchInsights
            result={outfit.result}
            count={outfit.selection.length}
            ai={outfit.ai}
            alternative={outfit.garments.find((g) => g.source === 'store' && g.slot === 'core' && !outfit.selection.some((entry) => entry.garmentId === g.id))}
            onAlternative={stage}
          />
        </div></AccountGate>
        <details className="studio-container styling-tips"><summary>Styling tips</summary><p>Start with a top and bottom. Try complementary colors, balance relaxed and structured pieces, and choose an occasion for more relevant feedback. Save your favorite combinations to revisit later.</p></details>
      </main>
      <StorefrontFooter />
      <div
        className={`shop-toast${message && !dialog ? ' visible' : ''}`}
        role="status"
        aria-atomic="true"
      >
        {message && !dialog && (
          <>
            <Icon name="check" />
            <span>{message}</span>
            <button
              className="icon-button"
              aria-label="Dismiss notification"
              onClick={() => setMessage('')}
            >
              <Icon name="close" size={16} />
            </button>
          </>
        )}
      </div>
      {saved.storageError && (
        <p className="storage-notice" role="alert">
          Your browser couldn’t save these changes. They’ll last for this visit
          only.
        </p>
      )}
      {dialog === 'save' && (
        <SaveLookDialog
          initialName={outfit.name}
          atLimit={saved.looks.length >= 20}
          onClose={() => setDialog(null)}
          onSave={(name) => {
            if (
              saved.save({
                name,
                selection: outfit.selection.map((entry) => ({ ...entry })),
                occasion: outfit.occasion,
              })
            ) {
              outfit.setName(name)
              setDialog(null)
              setMessage('Look saved. Find it in Saved Looks.')
            }
          }}
        />
      )}
      {dialog === 'saved' && (
        <SavedLooksDialog
          looks={saved.looks}
          garments={outfit.garments}
          onClose={() => setDialog(null)}
          onRemove={saved.remove}
          onLoad={(look) => {
            outfit.load(look)
            setDialog(null)
            setMessage(`Loaded ${look.name}.`)
          }}
        />
      )}

    </div>
  )
}
