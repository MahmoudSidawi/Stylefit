import { products } from './mockCatalogue'
import { studioProducts } from './studioProducts'

// Shared bag inventory; adding studio fixtures does not change the approved catalogue.
export const demoInventory = [...products, ...studioProducts]
