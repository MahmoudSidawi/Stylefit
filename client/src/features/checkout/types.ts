import type { DeliveryMethod } from '../cart/utils/bagTotals'

export type CheckoutDetails = {
  email: string
  firstName: string
  lastName: string
  address: string
  apartment: string
  city: string
  postalCode: string
  country: string
  phone: string
}
export type CheckoutErrors = Partial<
  Record<keyof CheckoutDetails | 'acknowledged', string>
>
export type OrderPreview = {
  details: CheckoutDetails
  delivery: DeliveryMethod
  total: number
  itemCount: number
}
