import { demoInventory } from '../../products/data/demoInventory'
import type { BagItem } from '../../products/types'

export type DeliveryMethod = 'standard' | 'express'
export function bagTotals(
  bag: BagItem[],
  promoCode = '',
  delivery: DeliveryMethod = 'standard',
) {
  const subtotal = bag.reduce(
    (sum, item) =>
      sum +
      (demoInventory.find((product) => product.id === item.productId)?.price ??
        0) *
        100 *
        item.quantity,
    0,
  )
  const discount = promoCode === 'DEMO10' ? Math.round(subtotal * 0.1) : 0
  const shipping = !bag.length
    ? 0
    : delivery === 'express'
      ? 2500
      : subtotal >= 30000
        ? 0
        : 1200
  return {
    subtotal: subtotal / 100,
    discount: discount / 100,
    shipping: shipping / 100,
    total: (subtotal - discount + shipping) / 100,
    count: bag.reduce((sum, item) => sum + item.quantity, 0),
  }
}
