import { Pagination } from '../../../components/ui/Pagination'
import { usePagination } from '../../../components/ui/usePagination'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { StorefrontHeader } from '../../../components/layout/StorefrontHeader'
import { StorefrontFooter } from '../../../components/layout/StorefrontFooter'
import { Icon } from '../../../components/ui/Icon'
import { CollectionHero } from '../components/CollectionHero'
import { ProductCard } from '../components/ProductCard'
import { ProductPreview } from '../components/ProductPreview'
import { Editorial } from '../components/Editorial'
import { CatalogueFilters } from '../components/CatalogueFilters'
import { CatalogueSort } from '../components/CatalogueSort'
import { shopApi } from '../../../services/shopApi'
import { useSession } from '../../auth/sessionContext'
import { useAction, useRemote } from '../../live/hooks'
import { Notice } from '../../live/shared'
import { toProduct, loadCatalogue } from '../data/apiCatalogue'
import type { Category, Product, SortOrder } from '../types'
import '../styles/catalogue.css'
import '../styles/clothes.css'

export default function CataloguePage({
  allClothes = false,
}: {
  allClothes?: boolean
}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''
  function setQuery(value: string) {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current)
        if (value) next.set('q', value)
        else next.delete('q')
        return next
      },
      { replace: true },
    )
  }
  const [category, setCategory] = useState<Category>('all')
  const [sort, setSort] = useState<SortOrder>('editorial')
  const [showNotes, setShowNotes] = useState(false)
  const [savedOnly, setSavedOnly] = useState(false)
  const [maxPrice, setMaxPrice] = useState(100)
  const [filterSize, setFilterSize] = useState('all')
  const [preview, setPreview] = useState<Product | null>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const [announcement, setAnnouncement] = useState(location.state?.message ?? '')
  const { session } = useSession()
  const catalogue = useRemote(loadCatalogue, 'catalogue')
  const categoryData = useRemote(shopApi.categories, 'categories')
  const content = useRemote(shopApi.storefront, 'storefront', !allClothes)
  const categories = [{ id: 'all' as const, label: 'All Clothes' }, ...(categoryData.data ?? []).map((row) => ({ id: row.category_id, label: row.name }))]
  const products = (catalogue.data?.items ?? []).map(toProduct)
  const saved = useRemote(shopApi.wishlist, session?.user.id ?? 'guest', !!session)
  const cart = useRemote(shopApi.cart, session?.user.id ?? 'guest', !!session)
  const action = useAction()
  const favorites = saved.data?.map((row) => row.product_id) ?? []
  const bagCount = cart.data?.reduce((sum, item) => sum + item.quantity, 0) ?? 0
  function toggleFavorite(id: string) {
    if (!session) { navigate('/login'); return }
    void action.run(() => favorites.includes(id) ? shopApi.unsaveProduct(id) : shopApi.saveProduct(id))
  }
  const hasFilters =
    query !== '' ||
    category !== 'all' ||
    savedOnly ||
    maxPrice < 100 ||
    filterSize !== 'all'
  const visibleProducts = products
    .filter(
      (product) =>
        (category === 'all' || product.category === category) &&
        `${product.name} ${product.description}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()) &&
        (!savedOnly || favorites.includes(product.id)) &&
        (maxPrice === 100 || product.price <= maxPrice) &&
        (filterSize === 'all' || product.sizes.includes(filterSize)),
    )
    .sort((a, b) =>
      sort === 'price-asc'
        ? a.price - b.price
        : sort === 'price-desc'
          ? b.price - a.price
          : 0,
    )

  const pagination = usePagination(visibleProducts, allClothes ? 8 : 4, JSON.stringify([allClothes, query, category, sort, savedOnly, maxPrice, filterSize]))

  useEffect(() => {
    document.title = allClothes
      ? 'All Clothes — StyleFit'
      : 'Spring Architecture — StyleFit'
    return () => {
      document.title = 'StyleFit'
    }
  }, [allClothes])

  useEffect(() => {
    if (!announcement) return
    const timer = window.setTimeout(() => setAnnouncement(''), 4500)
    return () => window.clearTimeout(timer)
  }, [announcement])

  function resetFilters() {
    setQuery('')
    setCategory('all')
    setSavedOnly(false)
    setMaxPrice(100)
    setFilterSize('all')
    setSort('editorial')
  }
  async function addProduct(product: Product, size: string) {
    if (!session) { navigate('/login'); return false }
    const variant = product.variants?.find((entry) => entry.size === size && entry.is_active && entry.stock_quantity > 0)
    const success = await action.run(async () => {
      if (!variant) throw new Error('This size is sold out.')
      await shopApi.addToCart(variant.variant_id)
    })
    if (success) setAnnouncement(`${product.name} / Size ${size} added to your bag.`)
    return success
  }

  return (
    <div
      className={`storefront${allClothes ? ' all-clothes-page' : ' storefront-home'}`}
    >
      <StorefrontHeader
        query={query}
        onSearch={setQuery}
        bagCount={bagCount}
        searchLabel={allClothes ? 'Search all clothes' : 'Search best sellers'}
      />
      <main id="catalogue-content" className="store-main" tabIndex={-1}>
        {!allClothes && (
          <div className="curatorial-bar">
            <div className="store-container">
              <span>
                <i /> <strong>Édition Printemps</strong>
                <span className="bar-divider">/</span> A study in modern
                silhouettes
              </span>
              <span>
                <Icon name="sparkles" size={13} /> The StyleFit collection
              </span>
            </div>
          </div>
        )}
        <div className="store-container catalogue-body">
          {allClothes ? (
            <div className="clothes-heading">
              <div>
                <div>
                  <h1>All Clothes</h1>
                </div>
                <span className="clothes-edition">
                  {products.length} pieces / The essentials edit
                </span>
              </div>
            </div>
          ) : (
            content.data && <CollectionHero count={products.length} content={content.data} />
          )}
          {!allClothes && (
            <>
              <section
                className="wardrobe-banner"
                aria-label="Wardrobe styling notes"
              >
                <div className="wardrobe-copy">
                  <span className="wardrobe-icon">
                    <Icon name="wardrobe" size={25} />
                  </span>
                  <div>
                    <h2>
                      Style starts with what you love{' '}
                      <span className="small-badge">StyleFit</span>
                    </h2>
                    <p>
                      Bring your favorite pieces into the outfit studio for AI styling suggestions.
                    </p>
                  </div>
                </div>
                <label className="sync-control">
                  <input
                    type="checkbox"
                    role="switch"
                    checked={showNotes}
                    onChange={(event) => setShowNotes(event.target.checked)}
                  />
                  <span className="switch-track" aria-hidden="true" />
                  <span>Styling notes: {showNotes ? 'On' : 'Off'}</span>
                </label>
              </section>
            </>
          )}
          <Notice {...catalogue} /><Notice {...categoryData} /><Notice {...content} /><Notice {...action} /><Notice error={saved.error || cart.error} />
          <section
            id="collection"
            className={`collection-section${allClothes ? ' clothes-layout' : ''}`}
            aria-label="Shop the collection"
          >
            {allClothes && (
              <CatalogueFilters
                categories={categories}
                products={products}
                category={category}
                setCategory={setCategory}
                maxPrice={maxPrice}
                setMaxPrice={setMaxPrice}
                filterSize={filterSize}
                setFilterSize={setFilterSize}
                savedOnly={savedOnly}
                setSavedOnly={setSavedOnly}
                favoriteCount={
                  products.filter((product) =>
                    favorites.includes(product.id),
                  ).length
                }
                resetFilters={resetFilters}
              />
            )}
            <div className="clothes-results">
              {allClothes ? (
                <div className="clothes-results-toolbar">
                  <p role="status">
                    Showing <strong>{visibleProducts.length}</strong> of{' '}
                    {products.length} pieces
                  </p>
                  <CatalogueSort value={sort} onChange={setSort} />
                </div>
              ) : (
                <div className="best-sellers-heading">
                  <div>
                    <p className="overline">The essentials edit</p>
                    <h2>Featured Pieces</h2>
                    <p>Four standout pieces from our essentials collection.</p>
                  </div>
                  <Link
                    className="button button-surface"
                    to={
                      query.trim()
                        ? `/clothes?q=${encodeURIComponent(query.trim())}`
                        : '/clothes'
                    }
                  >
                    Shop All Clothes <Icon name="arrow" size={16} />
                  </Link>
                </div>
              )}
              {hasFilters && (
                <div className="results-summary">
                  <p role="status">
                    {visibleProducts.length}{' '}
                    {visibleProducts.length === 1 ? 'piece' : 'pieces'} found
                    {query.trim() ? ` for “${query.trim()}”` : ''}
                  </p>
                  <button className="text-button" onClick={resetFilters}>
                    Clear filters <Icon name="close" size={14} />
                  </button>
                </div>
              )}
              {visibleProducts.length > 0 ? (
                <div className="product-grid">
                  {pagination.items.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      favorite={favorites.includes(product.id)}
                      showNotes={showNotes}
                      onFavorite={toggleFavorite}
                      onAdd={addProduct}
                      onPreview={setPreview}
                    />
                  ))}
                </div>
              ) : !catalogue.loading && !catalogue.error ? (
                <div className="empty-results">
                  <Icon name="search" size={30} />
                  <h2>A fresh perspective?</h2>
                  <p>
                    No pieces match these filters. Try another search or explore
                    the full collection.
                  </p>
                  <button
                    className="button button-primary"
                    onClick={resetFilters}
                  >
                    {allClothes ? 'Show all garments' : 'Show best sellers'}
                  </button>
                </div>
              ) : null}
              {allClothes && <Pagination {...pagination} />}
              {!allClothes && (
                <p className="best-sellers-note">
                  A curated selection from the StyleFit collection.
                </p>
              )}
            </div>
          </section>
          {!allClothes && content.data && <Editorial content={content.data} />}
        </div>
      </main>
      <StorefrontFooter />
      <div
        className={`shop-toast${announcement && !preview ? ' visible' : ''}`}
        role="status"
        aria-atomic="true"
      >
        {announcement && !preview && (
          <>
            <Icon name="check" />
            <span>{announcement}</span>
            <button
              onClick={() => {
                setAnnouncement('')
                navigate('/cart')
              }}
            >
              View bag
            </button>
            <button
              className="icon-button"
              aria-label="Dismiss notification"
              onClick={() => setAnnouncement('')}
            >
              <Icon name="close" size={16} />
            </button>
          </>
        )}
      </div>
      {preview && (
        <ProductPreview
          product={preview}
          onClose={() => setPreview(null)}
          onAdd={addProduct}
        />
      )}

    </div>
  )
}
