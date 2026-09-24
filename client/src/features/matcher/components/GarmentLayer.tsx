import { useEffect, useState } from 'react'
import type { Garment } from '../types'

type Bounds = { x: number; y: number; width: number; height: number; naturalWidth: number; naturalHeight: number }
const boundsCache = new Map<string, Promise<Bounds>>()

// Measure the visible pixels, so transparent margins never change garment placement.
// The source photo is preserved; the SVG viewport uses its content bounds.
function imageBounds(url: string) {
  const cached = boundsCache.get(url)
  if (cached) return cached
  const pending = new Promise<Bounds>((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => {
      const naturalWidth = image.naturalWidth, naturalHeight = image.naturalHeight
      const fallback = { x: 0, y: 0, width: naturalWidth, height: naturalHeight, naturalWidth, naturalHeight }
      try {
        const ratio = Math.min(1, 512 / Math.max(naturalWidth, naturalHeight))
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, Math.round(naturalWidth * ratio))
        canvas.height = Math.max(1, Math.round(naturalHeight * ratio))
        const context = canvas.getContext('2d', { willReadFrequently: true })!
        context.drawImage(image, 0, 0, canvas.width, canvas.height)
        const { data } = context.getImageData(0, 0, canvas.width, canvas.height)
        let left = canvas.width, top = canvas.height, right = -1, bottom = -1
        for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
          if (data[(y * canvas.width + x) * 4 + 3] > 32) {
            left = Math.min(left, x); right = Math.max(right, x)
            top = Math.min(top, y); bottom = Math.max(bottom, y)
          }
        }
        resolve(right < left ? fallback : { ...fallback, x: left / ratio, y: top / ratio, width: (right - left + 1) / ratio, height: (bottom - top + 1) / ratio })
      } catch { resolve(fallback) }
    }
    image.onerror = () => { boundsCache.delete(url); reject(new Error('Photo unavailable')) }
    image.src = url
  })
  boundsCache.set(url, pending)
  return pending
}

function garmentPlacement(garment: Garment) {
  if (garment.slot === 'hat') return { x: 123, y: 15, width: 74, height: 47 }
  if (garment.slot === 'shoes') return { x: 111, y: 389, width: 98, height: 55 }
  if (garment.slot === 'dress') return { x: 103, y: 103, width: 114, height: 275 }
  if (garment.slot === 'anchor') {
    if (garment.clothingType === 'shorts') return { x: 112, y: 224, width: 96, height: 84 }
    if (garment.clothingType === 'skirts') return { x: 100, y: 224, width: 120, height: 145 }
    return { x: 103, y: 224, width: 114, height: 198 }
  }
  if (garment.clothingType === 'hoodies') return { x: 79, y: 85, width: 162, height: 180 }
  if (garment.clothingType === 'shirts') return { x: 80, y: 104, width: 160, height: 162 }
  return { x: 96, y: 105, width: 128, height: 139 }
}

export function GarmentLayer({ garment }: { garment: Garment }) {
  const url = garment.detailImage
  const [loaded, setLoaded] = useState<{ url: string; bounds: Bounds } | null>(null)
  useEffect(() => {
    let active = true
    if (url) void imageBounds(url).then((bounds) => { if (active) setLoaded({ url, bounds }) }).catch(() => {})
    return () => { active = false }
  }, [url])
  if (!url) return null
  const bounds = loaded?.url === url ? loaded.bounds : null
  // Reviewed single-shoe assets declare their view in the Storage object name.
  // Unknown/user-uploaded pair photos keep their full aspect ratio instead.
  const shoeView = garment.slot === 'shoes' ? url.match(/shoe-single-(left|right)-/)?.[1] : undefined
  const viewBox = bounds ? `${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}` : '0 0 300 400'
  const photo = <image href={url} width={bounds?.naturalWidth ?? 300} height={bounds?.naturalHeight ?? 400} preserveAspectRatio="xMidYMid meet" />
  if (shoeView && bounds) {
    const height = /boot/i.test(garment.name) ? 48 : /high.top/i.test(garment.name) ? 36 : 28
    return <g data-garment-slot="shoes" data-clothing-type={garment.clothingType}>
      {['left', 'right'].map((foot) => <g key={foot} data-shoe-foot={foot} transform={foot === 'right' ? 'translate(320 0) scale(-1 1)' : undefined}>
        <svg x={103} y={438 - height} width={48} height={height} viewBox={viewBox} preserveAspectRatio="xMaxYMax meet">
          <g transform={shoeView === 'right' ? `translate(${2 * bounds.x + bounds.width} 0) scale(-1 1)` : undefined}>{photo}</g>
        </svg>
      </g>)}
    </g>
  }
  return <g data-garment-slot={garment.slot} data-clothing-type={garment.clothingType}>
    <svg {...garmentPlacement(garment)} viewBox={viewBox} preserveAspectRatio={garment.slot === 'shoes' ? 'xMidYMax meet' : 'none'} overflow="visible">
      {photo}
    </svg>
  </g>
}
