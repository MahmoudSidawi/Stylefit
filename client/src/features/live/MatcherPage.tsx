import { useState } from 'react'
import { useSession } from '../auth/sessionContext'
import { shopApi, type AiMatch, type MatchSelection } from '../../services/shopApi'
import { LiveLayout, Notice } from './shared'
import { useRemote } from './hooks'

export default function LiveMatcher() {
  const { session } = useSession()
  const products = useRemote(() => shopApi.products(new URLSearchParams({ limit: '100' })), 'matching-products', !!session)
  const wardrobe = useRemote(shopApi.wardrobe, session?.user.id ?? '', !!session)
  const [selection, setSelection] = useState<Record<string, MatchSelection>>({})
  const [occasion, setOccasion] = useState('weekend')
  const [includeProfile, setIncludeProfile] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<AiMatch | null>(null)
  const [variants, setVariants] = useState<Record<string, string>>({})
  const count = Object.keys(selection).length
  function toggle(key: string, value: MatchSelection) {
    setResult(null); setError('')
    setSelection((current) => {
      const next = { ...current }
      if (next[key]) delete next[key]
      else if (Object.keys(next).length < 3) next[key] = value
      return next
    })
  }
  async function check() {
    if (busy) return
    setBusy(true); setError(''); setResult(null)
    try { setResult(await shopApi.match(Object.values(selection), occasion, includeProfile)) }
    catch (error) { setError(error instanceof Error ? error.message : 'The AI check failed. Please retry.') }
    finally { setBusy(false) }
  }
  return <LiveLayout title="AI Outfit Matcher" privatePage>
    <p>Select two or three garments from the store, your wardrobe, or both. Groq will explain color, style, pattern, and clothing-type compatibility. Selected wardrobe photos are sent only when you run a check.</p>
    <Notice {...products} /><Notice {...wardrobe} /><Notice error={error} />
    <fieldset disabled={busy}>
      <div className="live-controls"><label>Occasion<select value={occasion} onChange={(e) => { setOccasion(e.target.value); setResult(null) }}><option value="weekend">Everyday / weekend</option><option value="work">Work</option><option value="evening">Evening</option></select></label>
        <label className="live-check"><input type="checkbox" checked={includeProfile} onChange={(e) => { setIncludeProfile(e.target.checked); setResult(null) }} />Include my saved optional body details and skin tone in this check</label>
      </div>
      <div className="live-actions"><strong>{count} of 3 pieces selected</strong><button className="button button-primary" disabled={count < 2 || busy} onClick={check}>{busy ? 'Checking with Groq…' : 'Check outfit with AI'}</button><button className="button button-surface" onClick={() => { setSelection({}); setResult(null) }}>Clear selection</button></div>
      <h2>Store clothes</h2><div className="live-grid">{products.data?.items.map((product) => {
        const selected = !!selection[product.product_id]
        const variantId = variants[product.product_id] ?? product.product_variants[0]?.variant_id
        const variant = product.product_variants.find((item) => item.variant_id === variantId)
        return <article className={`live-card${selected ? ' selected' : ''}`} key={product.product_id}>
          {variant && <img src={variant.image_url} alt={product.name} loading="lazy" />}<h3>{product.name}</h3>
          <label>Size and color<select value={variantId} onChange={(event) => {
            const id = event.target.value
            setVariants({ ...variants, [product.product_id]: id }); setResult(null)
            if (selected) setSelection({ ...selection, [product.product_id]: { source: 'store', variant_id: id } })
          }}>{product.product_variants.map((item) => <option value={item.variant_id} key={item.variant_id}>{item.size} · {item.color}</option>)}</select></label>
          <button className="button button-surface" disabled={!variant || (!selected && count >= 3)} aria-pressed={selected} onClick={() => toggle(product.product_id, { source: 'store', variant_id: variantId })}>{selected ? 'Remove from outfit' : 'Select garment'}</button>
        </article>
      })}</div>
      <h2>Your wardrobe</h2><div className="live-grid">{wardrobe.data?.map((item) => {
        const selected = !!selection[item.wardrobe_item_id]
        return <article className={`live-card${selected ? ' selected' : ''}`} key={item.wardrobe_item_id}><h3>{item.name}</h3><p>{item.category_id} · {item.color}</p><button className="button button-surface" aria-pressed={selected} disabled={!selected && count >= 3} onClick={() => toggle(item.wardrobe_item_id, { source: 'wardrobe', wardrobe_item_id: item.wardrobe_item_id })}>{selected ? 'Remove from outfit' : 'Select garment'}</button></article>
      })}</div>
      {wardrobe.data?.length === 0 && <p>Add your own clothes on the Wardrobe page to include them here.</p>}
    </fieldset>
    {busy && <p role="status">Groq is analyzing your selected garments…</p>}
    {result && <section aria-label="AI analysis" aria-live="polite"><h2>Your outfit analysis</h2><strong className="live-score">{result.score}%</strong><p>{result.explanation}</p><div className="live-grid">{([
      ['Colors', result.colors], ['Styles', result.styles], ['Patterns', result.patterns], ['Clothing types', result.clothing_types], ['Occasion', result.occasion],
    ] as const).map(([label, dimension]) => <article className="live-card" key={label}><h3>{label} · {dimension.score}%</h3><p>{dimension.explanation}</p></article>)}</div>
      {result.suggestions.length > 0 && <><h3>Things to try</h3><ul>{result.suggestions.map((text) => <li key={text}>{text}</li>)}</ul></>}
      <p>{result.disclaimer} {result.used_profile ? 'Your selected profile details were included.' : 'No profile details were included.'}</p>
    </section>}
  </LiveLayout>
}
