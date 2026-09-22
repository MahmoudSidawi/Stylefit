import { useId } from 'react'
import { Icon } from '../../../components/ui/Icon'
import { formatMoney } from '../../../utils/currency'
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
  onSave: () => void
  onAddBag: () => void
}

export function OutfitCanvas({ busy = false, selected, name, total, storeCount, onRemove, onSize, onCheck, onClear, onSave, onAddBag }: Props) {
  const id = useId().replace(/:/g, '')
  const top = selected.find(({ garment }) => garment.slot === 'core')?.garment
  const bottom = selected.find(({ garment }) => garment.slot === 'anchor')?.garment
  const dress = selected.find(({ garment }) => garment.slot === 'dress')?.garment
  const shapes = [
    { garment: bottom, slot: 'anchor', x: 105, y: 218, width: 110, height: 192, path: 'M116 218 L204 218 L210 268 L190 410 L160 410 L161 285 L153 285 L151 410 L121 410 L106 268 Z' },
    { garment: dress, slot: 'dress', x: 79, y: 104, width: 162, height: 276, path: 'M128 104 Q160 126 192 104 L211 124 L195 193 L241 380 Q160 395 79 380 L125 193 L109 124 Z' },
    { garment: top, slot: 'core', x: 80, y: 104, width: 160, height: 137, path: 'M128 104 Q160 129 192 104 L213 120 L240 170 L209 185 L197 159 L204 241 Q160 250 116 241 L123 159 L111 185 L80 170 L107 120 Z' },
  ]
  return <section className="canvas-column" aria-labelledby="canvas-title">
    <div className="canvas-heading"><div><span className="overline">YOUR OUTFIT</span><h2 id="canvas-title">{name}</h2></div>
      <button className="icon-button" aria-label="Clear canvas" disabled={!selected.length || busy} onClick={onClear}><Icon name="reset" size={18} /></button></div>
    <div className="person-preview">
      <span className="preview-tag">Front view</span>
      <svg className="outfit-person" viewBox="0 0 320 460" role="img" aria-label={`Mannequin outfit preview${selected.length ? ': ' + selected.map(({ garment }) => garment.name).join(', ') : ': choose clothes to begin'}`}>
        <defs>{shapes.map(({ slot, path }) => <clipPath key={slot} id={`${id}-${slot}`}><path d={path} /></clipPath>)}</defs>
        <ellipse cx="160" cy="438" rx="89" ry="9" fill="#dfd9ce" opacity=".6" />
        <g fill="#ded4c7" stroke="#c3b6a6" strokeWidth="1.2">
          <ellipse cx="160" cy="58" rx="27" ry="35" />
          <path d="M146 88 L145 105 Q121 108 110 126 L88 204 L76 267 Q80 282 89 270 L105 211 L122 166 L117 233 Q102 269 116 301 L127 415 L122 433 Q123 440 151 435 L158 295 L165 295 L171 435 Q199 440 198 432 L192 415 L204 301 Q218 268 203 233 L198 166 L215 211 L231 270 Q240 282 244 267 L232 204 L210 126 Q199 109 175 105 L174 88" />
        </g>
        {shapes.map(({ garment, slot, path, x, y, width, height }) => garment && <g key={slot} data-garment-slot={slot}>
          <g clipPath={`url(#${id}-${slot})`}>
            <rect x={x} y={y} width={width} height={height} fill={garment.color} />
            <svg x={x} y={y} width={width} height={height} viewBox={garment.detailImage.startsWith('/clothes/') ? (slot === 'anchor' ? '125 100 170 280' : slot === 'dress' ? '110 80 200 305' : '60 115 300 240') : '0 0 300 400'} preserveAspectRatio="none">
              <image href={garment.detailImage} width={garment.detailImage.startsWith('/clothes/') ? 420 : 300} height={garment.detailImage.startsWith('/clothes/') ? 480 : 400} preserveAspectRatio="xMidYMid slice" />
            </svg>
          </g>
          <path d={path} fill="none" stroke="#6e665e" strokeWidth="1.2" strokeLinejoin="round" />
        </g>)}
      </svg>
      {!selected.length && <p className="preview-hint">Choose a top and bottom<br />to build your look.</p>}
      <span className="preview-caption">Illustrative preview / actual fit may vary</span>
    </div>
    <div className="selected-pieces" aria-label="Selected clothes">
      {selected.map(({ garment, size }) => <article className="selected-piece" key={garment.id}>
        <img src={garment.detailImage} alt="" /><div><h3>{garment.name}</h3><span>{garment.source === 'store' ? formatMoney(garment.price) : 'From your wardrobe'}</span></div>
        <select aria-label={`Size for ${garment.name}`} value={size} onChange={(event) => onSize(garment.id, event.target.value)}>{garment.sizes.map((option) => <option key={option}>{option}</option>)}</select>
        <button className="icon-button" aria-label={`Remove ${garment.name} from canvas`} onClick={() => onRemove(garment.id)}><Icon name="close" size={15} /></button>
      </article>)}
    </div>
    <div className="fitting-actions"><button className="button button-primary check-outfit" disabled={busy || selected.length < 2} onClick={onCheck}><Icon name="sparkles" size={17} />{busy ? 'Checking...' : 'Check outfit with AI'}</button>
      <div className="look-purchase"><span><strong>{formatMoney(total)}</strong><small>{storeCount} store {storeCount === 1 ? 'piece' : 'pieces'}</small></span>
        <button className="button button-surface" disabled={!selected.length || busy} onClick={onSave}>Save Look</button>
        <button className="button button-surface" disabled={busy || !storeCount} onClick={onAddBag}><Icon name="bag" size={16} />Add to Bag</button></div>
    </div>
  </section>
}
