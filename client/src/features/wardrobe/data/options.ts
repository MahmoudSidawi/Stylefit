import type { GarmentColor, GarmentKind, WardrobeCategory } from '../types'

export const kinds: Record<
  GarmentKind,
  { label: string; category: WardrobeCategory }
> = {
  knitwear: { label: 'Knitwear', category: 'tops' },
  shirts: { label: 'Shirts & Tops', category: 'tops' },
  tailoring: { label: 'Tailoring', category: 'trousers' },
  denim: { label: 'Denim', category: 'trousers' },
  outerwear: { label: 'Outerwear', category: 'outerwear' },
  footwear: { label: 'Footwear', category: 'accessories' },
  accessories: { label: 'Accessories', category: 'accessories' },
}
export const colors: Record<
  GarmentColor,
  { label: string; hex: string; tone: 'warm' | 'cool' | 'neutral' }
> = {
  cream: { label: 'Warm Cream', hex: '#e9deca', tone: 'neutral' },
  charcoal: { label: 'Deep Charcoal', hex: '#454343', tone: 'neutral' },
  white: { label: 'Crisp White', hex: '#f7f5ef', tone: 'neutral' },
  camel: { label: 'Cognac Tan', hex: '#b48961', tone: 'warm' },
  indigo: { label: 'Deep Indigo', hex: '#303c57', tone: 'cool' },
  plum: { label: 'Bordeaux Plum', hex: '#63334e', tone: 'cool' },
  black: { label: 'Soft Black', hex: '#292524', tone: 'neutral' },
  terracotta: { label: 'Terracotta', hex: '#b84d2f', tone: 'warm' },
  sage: { label: 'Sage Green', hex: '#9b9e82', tone: 'cool' },
  blue: { label: 'Sky Blue', hex: '#9bbacc', tone: 'cool' },
}
export const wardrobeCategories: { id: WardrobeCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'tops', label: 'Tops & Knits' },
  { id: 'trousers', label: 'Trousers' },
  { id: 'outerwear', label: 'Outerwear' },
  { id: 'accessories', label: 'Shoes & Accessories' },
]
export function isKind(value: string): value is GarmentKind {
  return Object.hasOwn(kinds, value)
}
export function isColor(value: string): value is GarmentColor {
  return Object.hasOwn(colors, value)
}
