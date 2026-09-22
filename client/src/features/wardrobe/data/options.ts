import type { GarmentColor, GarmentKind, WardrobeCategory } from '../types'

export const kinds: Record<
  GarmentKind,
  { label: string; category: WardrobeCategory }
> = {
  't-shirts': { label: 'T-shirts', category: 'tops' },
  'shirts': { label: 'Shirts', category: 'tops' },
  'hoodies': { label: 'Hoodies', category: 'tops' },
  'jeans': { label: 'Jeans', category: 'bottoms' },
  'pants': { label: 'Pants', category: 'bottoms' },
  'shorts': { label: 'Shorts', category: 'bottoms' },
  'skirts': { label: 'Skirts', category: 'bottoms' },
  'dresses': { label: 'Dresses', category: 'dresses' },

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
  { id: 'tops', label: 'Tops' },
  { id: 'bottoms', label: 'Bottoms' },
  { id: 'dresses', label: 'Dresses' },
]
export function isKind(value: unknown): value is GarmentKind {
  return typeof value === 'string' && Object.hasOwn(kinds, value)
}
export function isColor(value: unknown): value is GarmentColor {
  return typeof value === 'string' && Object.hasOwn(colors, value)
}
