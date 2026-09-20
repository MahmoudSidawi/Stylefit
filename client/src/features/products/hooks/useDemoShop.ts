import { useState } from 'react'
import { demoInventory as products } from '../data/demoInventory'
import type { BagItem, ShopState } from '../types'

const storageKey = 'stylefit:storefront-demo:v1'
const emptyShop: ShopState = { favorites: [], bag: [] }

function isBagItem(value: unknown): value is BagItem {
  if (typeof value !== 'object' || value === null) return false
  if (!('productId' in value) || !('size' in value) || !('quantity' in value))
    return false
  return (
    products.some(
      (product) =>
        product.id === value.productId &&
        typeof value.size === 'string' &&
        product.sizes.includes(value.size),
    ) &&
    typeof value.quantity === 'number' &&
    Number.isInteger(value.quantity) &&
    value.quantity > 0 &&
    value.quantity <= 99
  )
}

function readShop(): ShopState {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem(storageKey) ?? 'null',
    )
    if (
      typeof value !== 'object' ||
      value === null ||
      !('favorites' in value) ||
      !('bag' in value)
    )
      return emptyShop
    if (!Array.isArray(value.favorites) || !Array.isArray(value.bag))
      return emptyShop
    return {
      promoCode:
        'promoCode' in value && value.promoCode === 'DEMO10' ? 'DEMO10' : '',
      favorites: value.favorites.filter(
        (id): id is string =>
          typeof id === 'string' && products.some((p) => p.id === id),
      ),
      bag: value.bag.filter(isBagItem),
    }
  } catch {
    return emptyShop
  }
}

export function useDemoShop() {
  const [shop, setShop] = useState(readShop)
  const [storageError, setStorageError] = useState(false)

  function save(next: ShopState) {
    setShop(next)
    try {
      localStorage.setItem(storageKey, JSON.stringify(next))
      setStorageError(false)
    } catch {
      setStorageError(true)
    }
  }

  function toggleFavorite(id: string) {
    save({
      ...shop,
      favorites: shop.favorites.includes(id)
        ? shop.favorites.filter((saved) => saved !== id)
        : [...shop.favorites, id],
    })
  }

  function addToBag(productId: string, size: string) {
    addItemsToBag([{ productId, size }])
  }

  function addItemsToBag(items: Pick<BagItem, 'productId' | 'size'>[]) {
    const bag = [...shop.bag]
    for (const { productId, size } of items) {
      const product = products.find((item) => item.id === productId)
      if (!product?.sizes.includes(size)) continue
      const index = bag.findIndex(
        (item) => item.productId === productId && item.size === size,
      )
      if (index === -1) bag.push({ productId, size, quantity: 1 })
      else
        bag[index] = {
          ...bag[index],
          quantity: Math.min(99, bag[index].quantity + 1),
        }
    }
    save({ ...shop, bag })
  }

  function setQuantity(productId: string, size: string, quantity: number) {
    save({
      ...shop,
      bag: shop.bag
        .map((item) =>
          item.productId === productId && item.size === size
            ? { ...item, quantity: Math.min(99, quantity) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    })
  }

  function changeBagSize(productId: string, fromSize: string, toSize: string) {
    if (
      fromSize === toSize ||
      !products.find((item) => item.id === productId)?.sizes.includes(toSize)
    )
      return
    const source = shop.bag.find(
      (item) => item.productId === productId && item.size === fromSize,
    )
    if (!source) return
    const target = shop.bag.find(
      (item) => item.productId === productId && item.size === toSize,
    )
    const next = target
      ? shop.bag
          .filter((item) => item !== source)
          .map((item) =>
            item === target
              ? {
                  ...item,
                  quantity: Math.min(99, item.quantity + source.quantity),
                }
              : item,
          )
      : shop.bag.map((item) =>
          item === source ? { ...item, size: toSize } : item,
        )
    save({ ...shop, bag: next })
  }
  function saveForLater(productId: string, size: string) {
    save({
      ...shop,
      favorites: [...new Set([...shop.favorites, productId])],
      bag: shop.bag.filter(
        (item) => item.productId !== productId || item.size !== size,
      ),
    })
  }
  function moveFavoriteToBag(productId: string, size: string) {
    const existing = shop.bag.find(
      (item) => item.productId === productId && item.size === size,
    )
    save({
      ...shop,
      favorites: shop.favorites.filter((id) => id !== productId),
      bag: existing
        ? shop.bag.map((item) =>
            item === existing
              ? { ...item, quantity: Math.min(99, item.quantity + 1) }
              : item,
          )
        : [...shop.bag, { productId, size, quantity: 1 }],
    })
  }

  return {
    ...shop,
    storageError,
    toggleFavorite,
    addToBag,
    addItemsToBag,
    setQuantity,
    changeBagSize,
    saveForLater,
    moveFavoriteToBag,
    setPromoCode: (promoCode: string) =>
      save({ ...shop, promoCode: promoCode === 'DEMO10' ? promoCode : '' }),
  }
}
