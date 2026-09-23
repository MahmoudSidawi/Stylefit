import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSession } from '../auth/sessionContext'
import { shopApi, type WardrobeRecord, type GarmentAnalysis, type ClothingCategory } from '../../services/shopApi'
import { LiveLayout, Notice } from './shared'
import { useAction, useRemote } from './hooks'

import { clothingKinds } from './clothingKinds'

function WardrobeCard({ item, onEdit }: { item: WardrobeRecord; onEdit: (item: WardrobeRecord) => void }) {
  const photo = useRemote(() => shopApi.wardrobeImage(item.wardrobe_item_id), item.wardrobe_item_id)
  const action = useAction()
  const [analysis, setAnalysis] = useState<GarmentAnalysis | null>(null)
  return <article className="live-card">
    {photo.data && <img src={photo.data.url} alt={item.name} />}
    <Notice {...photo} /><h2>{item.name}</h2><p>{item.category_id} · {item.color || 'Color not set'} · {item.size || 'Size not set'}</p>
    <div className="live-actions">
      <button className="button button-surface" onClick={() => onEdit(item)}>Edit</button>
      <button className="button button-surface" disabled={action.busy} onClick={() => action.run(async () => { setAnalysis(await shopApi.analyzeGarment(item.wardrobe_item_id)) })}>{action.busy ? 'Working…' : 'Suggest details with AI'}</button>
      <button className="button button-surface" disabled={action.busy} onClick={() => {
        if (window.confirm(`Delete ${item.name} and its photo?`)) void action.run(() => shopApi.deleteGarment(item.wardrobe_item_id))
      }}>Delete</button>
    </div><Notice {...action} />
    {analysis && <div><h3>Suggested details</h3><p>{analysis.description}</p><p>{analysis.name} · {analysis.clothing_type} · {analysis.color} · {analysis.pattern}</p><p>Confidence: {analysis.confidence}. Review before saving.</p>
      <button className="button button-primary" disabled={action.busy || analysis.confidence === 'low'} onClick={() => action.run(async () => {
        await shopApi.updateGarment(item.wardrobe_item_id, { name: analysis.name, category_id: analysis.category_id,
          clothing_type: analysis.clothing_type, color: analysis.color, style: analysis.style, pattern: analysis.pattern,
          image_url: item.image_url, material: item.material, size: item.size })
        setAnalysis(null)
      }, 'Details saved.')}>Use these details</button></div>}
  </article>
}

export default function LiveWardrobe() {
  const { session } = useSession()
  const wardrobe = useRemote(shopApi.wardrobe, session?.user.id ?? '', !!session)
  const action = useAction()
  const [editing, setEditing] = useState<WardrobeRecord | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [filter, setFilter] = useState('all')
  const empty = { name: '', clothing_type: 't-shirts', color: '', material: '', size: '', style: 'casual', pattern: 'solid' }
  const [draft, setDraft] = useState(empty)
  const [formKey, setFormKey] = useState(0)
  function edit(item: WardrobeRecord) {
    setEditing(item); setFile(null)
    setDraft({ name: item.name, clothing_type: item.clothing_type ?? (item.category_id === 'dresses' ? 'dresses' : item.category_id === 'bottoms' ? 'pants' : 't-shirts'),
      color: item.color ?? '', material: item.material ?? '', size: item.size ?? '', style: item.style ?? 'casual', pattern: item.pattern ?? 'solid' })
    document.getElementById('garment-editor')?.scrollIntoView({ behavior: 'smooth' })
  }
  async function save(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    await action.run(async () => {
      if (!editing && !file) throw new Error('Choose a JPG or PNG photo.')
      if (file && (!['image/jpeg', 'image/png'].includes(file.type) || file.size > 5 * 1024 * 1024)) throw new Error('Use a JPG or PNG no larger than 5 MB.')
      const image = file ? (await shopApi.uploadWardrobeImage(file)).image_url : editing!.image_url
      const body = { ...draft, material: draft.material.trim() || null, size: draft.size.trim() || null, category_id: clothingKinds[draft.clothing_type as keyof typeof clothingKinds] as ClothingCategory, image_url: image }
      if (editing) await shopApi.updateGarment(editing.wardrobe_item_id, body)
      else await shopApi.addGarment(body)
      setEditing(null); setDraft(empty); setFile(null); setFormKey((key) => key + 1)
    }, 'Your garment has been saved.')
  }
  return <LiveLayout title="Your Wardrobe" privatePage>
    <p>Your photos stay private. “Suggest details with AI” sends the selected garment photo to Groq for tagging; suggestions are saved only when you choose to use them.</p>
    <Notice {...wardrobe} /><Notice {...action} />
    <form id="garment-editor" key={formKey} className="live-form" onSubmit={save}>
      <h2>{editing ? 'Edit garment' : 'Add a garment'}</h2>
      <label>Name<input required minLength={3} maxLength={120} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label>
      <label>Clothing type<select value={draft.clothing_type} onChange={(e) => setDraft({ ...draft, clothing_type: e.target.value })}>{Object.keys(clothingKinds).map((kind) => <option key={kind}>{kind}</option>)}</select></label>
      {(['color', 'material', 'size', 'style', 'pattern'] as const).map((field) => <label key={field}>{field[0].toUpperCase() + field.slice(1)}<input maxLength={120} required={['color', 'style', 'pattern'].includes(field)} value={draft[field]} onChange={(e) => setDraft({ ...draft, [field]: e.target.value })} /></label>)}
      <label>{editing ? 'Replace photo (optional)' : 'Photo'}<input type="file" accept="image/jpeg,image/png" required={!editing} onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></label>
      <button className="button button-primary" disabled={action.busy}>{action.busy ? 'Saving…' : 'Save garment'}</button>
      {editing && <button type="button" className="button button-surface" onClick={() => { setEditing(null); setDraft(empty); setFile(null); setFormKey((key) => key + 1) }}>Cancel edit</button>}
    </form>
    <div className="live-controls"><label>Category<select value={filter} onChange={(e) => setFilter(e.target.value)}><option value="all">All</option><option value="tops">Tops</option><option value="bottoms">Bottoms</option><option value="dresses">Dresses</option><option value="shoes">Shoes</option><option value="hats">Hats</option></select></label><Link to="/matcher">Match an outfit</Link></div>
    <div className="live-grid">{wardrobe.data?.filter((item) => filter === 'all' || item.category_id === filter).map((item) => <WardrobeCard key={item.wardrobe_item_id} item={item} onEdit={edit} />)}</div>
    {wardrobe.data?.length === 0 && <p>Your wardrobe is empty. Add your first garment above.</p>}
  </LiveLayout>
}
