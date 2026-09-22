import { shopApi, type StoreProduct } from '../../../services/shopApi'
import type { Product } from '../types'

export async function loadCatalogue() {
  const first = await shopApi.products(new URLSearchParams({ limit: '100' }))
  const items = [...first.items]
  for (let offset = items.length; offset < first.total; offset += 100) {
    const next = await shopApi.products(new URLSearchParams({ limit: '100', offset: String(offset) }))
    if (!next.items.length) break
    items.push(...next.items)
  }
  return { ...first, items }
}

export function toProduct(product: StoreProduct): Product {
  const variants = (product.product_variants ?? []).filter((variant) => variant.is_active)
  return { id: product.product_id, name: product.name, description: product.description,
    category: product.category_id, price: Number(variants[0]?.price ?? 0),
    sizes: [...new Set(variants.map((variant) => variant.size))],
    image: variants[0]?.image_url ?? '', match: 0, note: [product.style, product.pattern].filter(Boolean).join(' / '), variants }
}
