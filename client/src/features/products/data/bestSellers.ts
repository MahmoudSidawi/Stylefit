import { products } from './mockCatalogue'

// Editorial fixtures for the frontend; replace with sales-backed data later.
const bestSellerIds = ['architecte', 'nocturne', 'sienna', 'polo']
export const bestSellers = bestSellerIds.flatMap((id) => {
  const product = products.find((item) => item.id === id)
  return product ? [product] : []
})
