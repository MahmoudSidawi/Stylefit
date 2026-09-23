import type { SavedLook } from '../features/matcher/types'
import { apiRequest } from './api'

export type ClothingCategory = 'tops' | 'bottoms' | 'dresses' | 'shoes' | 'hats'
export type StorefrontContent = {
  title: string; subtitle: string; description: string
  hero_image: string; hero_alt: string; detail_image: string; detail_alt: string
  editorial_title: string; editorial_description: string
  curator_image: string; atelier_image: string; tailoring_image: string
}
export type Variant = {
  variant_id: string; product_id?: string; size: string; color: string
  price: number; stock_quantity: number; image_url: string; is_active: boolean
}
export type StoreProduct = {
  product_id: string; category_id: ClothingCategory; name: string; description: string
  clothing_type: string; style: string; pattern: string; is_active: boolean; product_variants: Variant[]
}
export type CartRecord = { cart_item_id: string; variant_id: string; quantity: number; product_variants: (Variant & { products: StoreProduct }) | null }
export type MatchSelection = { source: 'store'; variant_id: string } | { source: 'wardrobe'; wardrobe_item_id: string }
export type Dimension = { score: number; explanation: string }
export type AiMatch = {
  score: number; explanation: string; colors: Dimension; styles: Dimension; patterns: Dimension
  clothing_types: Dimension; occasion: Dimension; suggestions: string[]; provider: 'groq'
  model: string; used_profile: boolean; images_analyzed: number; disclaimer: string
}
export type GarmentAnalysis = {
  name: string; category_id: ClothingCategory; clothing_type: string; color: string
  style: string; pattern: string; description: string; confidence: 'low' | 'medium' | 'high'
}
export type Profile = {
  user_id: string; name: string; email: string; role: 'customer' | 'admin'
  height_cm: number | null; weight_kg: number | null; body_shape: string | null
  clothing_size: string | null; skin_tone: string | null
}
export type OrderStatus = 'placed' | 'shipped' | 'delivered' | 'cancelled'
export type Order = {
  order_id: string; total_amount: number; status: OrderStatus; is_paid: boolean; created_at: string
  order_items: { product_name: string; size: string; color: string; quantity: number; unit_price: number }[]
  recipient_name: string; phone: string; delivery_address: string
}
export type DeliveryDetails = { recipient_name: string; phone: string; delivery_address: string }
export type WardrobeRecord = {
  wardrobe_item_id: string; category_id: ClothingCategory; name: string; image_url: string; color: string | null
  clothing_type?: string | null; style?: string | null; pattern?: string | null; material?: string | null; size?: string | null
}
type WardrobeInput = Omit<WardrobeRecord, 'wardrobe_item_id'>
const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) })
const id = encodeURIComponent

export const shopApi = {
  storefront: () => apiRequest<StorefrontContent>('/api/content/storefront', {}, false),
  looks: () => apiRequest<SavedLook[]>('/api/looks'),
  saveLook: (look: Omit<SavedLook, 'id'>) => apiRequest<SavedLook>('/api/looks', json('POST', look)),
  deleteLook: (lookId: string) => apiRequest<void>(`/api/looks/${id(lookId)}`, { method: 'DELETE' }),
  categories: () => apiRequest<{ category_id: ClothingCategory; name: string; clothing_types: string[] }[]>('/api/categories', {}, false),
  products: (params = new URLSearchParams(), signal?: AbortSignal) =>
    apiRequest<{ items: StoreProduct[]; mode: 'live'; total: number; limit: number; offset: number }>(`/api/products?${params}`, { signal }, false),
  product: (productId: string) => apiRequest<StoreProduct>(`/api/products/${id(productId)}`, {}, false),
  me: () => apiRequest<Profile>('/api/me'),
  updateProfile: (profile: Pick<Profile, 'name'> & Partial<Pick<Profile, 'height_cm' | 'weight_kg' | 'body_shape' | 'clothing_size' | 'skin_tone'>>) =>
    apiRequest<Profile[]>('/api/me', json('PATCH', profile)),
  cart: () => apiRequest<CartRecord[]>('/api/cart'),
  addToCart: (variantId: string, quantity = 1) => apiRequest<null>('/api/cart/add', json('POST', { variant_id: variantId, quantity })),
  changeCartVariant: (variantId: string, newVariantId: string) => apiRequest('/api/cart/change-variant', json('POST', { from_variant_id: variantId, to_variant_id: newVariantId })),
  setCartItem: (variantId: string, quantity: number) => apiRequest<null>('/api/cart', json('PUT', { variant_id: variantId, quantity })),
  removeCartItem: (variantId: string) => apiRequest<void>(`/api/cart/${id(variantId)}`, { method: 'DELETE' }),
  wishlist: () => apiRequest<{ wishlist_item_id: string; product_id: string; products: StoreProduct }[]>('/api/wishlist'),
  saveProduct: (productId: string) => apiRequest('/api/wishlist', json('POST', { product_id: productId })),
  unsaveProduct: (productId: string) => apiRequest<void>(`/api/wishlist/${id(productId)}`, { method: 'DELETE' }),
  wardrobe: () => apiRequest<WardrobeRecord[]>('/api/wardrobe'),
  uploadWardrobeImage: (file: File) => {
    const body = new FormData()
    body.set('file', file)
    return apiRequest<{ image_url: string }>('/api/wardrobe/images', { method: 'POST', body })
  },
  wardrobeImage: (itemId: string) => apiRequest<{ url: string; expires_in: number }>(`/api/wardrobe/${id(itemId)}/image`),
  deleteUnusedWardrobeImage: (key: string) => apiRequest<void>(`/api/wardrobe/images/${id(key.split('/').at(-1) ?? '')}`, { method: 'DELETE' }),
  addGarment: (body: WardrobeInput) => apiRequest<WardrobeRecord[]>('/api/wardrobe', json('POST', body)),
  updateGarment: (itemId: string, body: WardrobeInput) => apiRequest<WardrobeRecord>(`/api/wardrobe/${id(itemId)}`, json('PUT', body)),
  deleteGarment: (itemId: string) => apiRequest<void>(`/api/wardrobe/${id(itemId)}`, { method: 'DELETE' }),
  orders: () => apiRequest<Order[]>('/api/orders'),
  placeOrder: (details: DeliveryDetails) => apiRequest<string>('/api/orders', json('POST', details)),
  adminOrders: () => apiRequest<Order[]>('/api/admin/orders'),
  updateOrder: (orderId: string, status: OrderStatus, isPaid: boolean) =>
    apiRequest<null>(`/api/admin/orders/${id(orderId)}`, json('PATCH', { status, is_paid: isPaid })),
  match: (items: MatchSelection[], occasion: string, includeProfile: boolean) =>
    apiRequest<AiMatch>('/api/matches', json('POST', { items, occasion, include_profile: includeProfile })),
  analyzeGarment: (itemId: string) => apiRequest<GarmentAnalysis>(`/api/wardrobe/${id(itemId)}/analyze`, { method: 'POST' }),
  adminMe: () => apiRequest<Profile>('/api/admin/me'),
  adminUsers: () => apiRequest<Pick<Profile, 'user_id' | 'name' | 'email' | 'role'>[]>('/api/admin/users'),
  updateUser: (userId: string, name: string) => apiRequest(`/api/admin/users/${id(userId)}`, json('PATCH', { name })),
  adminProducts: () => apiRequest<StoreProduct[]>('/api/admin/products'),
  uploadProductImage: (file: File) => {
    const body = new FormData(); body.set('file', file)
    return apiRequest<{ image_url: string }>('/api/admin/images', { method: 'POST', body })
  },
  addVariant: (productId: string, variant: Omit<Variant, 'variant_id' | 'product_id'>) =>
    apiRequest(`/api/admin/products/${id(productId)}/variants`, json('POST', variant)),
  renameCategory: (categoryId: ClothingCategory, name: string) =>
    apiRequest(`/api/admin/categories/${id(categoryId)}`, json('PATCH', { name })),
  createProduct: (product: Omit<StoreProduct, 'product_id' | 'product_variants'> & { variants: Omit<Variant, 'variant_id' | 'product_id'>[] }) =>
    apiRequest<string>('/api/admin/products', json('POST', product)),
  updateProduct: (product: StoreProduct) => {
    const { product_id, name, category_id, clothing_type, description, style, pattern, is_active } = product
    return apiRequest(`/api/admin/products/${id(product_id)}`, json('PUT', { name, category_id, clothing_type, description, style, pattern, is_active }))
  },
  updateVariant: (variant: Variant) => {
    const { variant_id, size, color, price, stock_quantity, image_url, is_active } = variant
    return apiRequest(`/api/admin/variants/${id(variant_id)}`, json('PUT', { size, color, price, stock_quantity, image_url, is_active }))
  },
}
