import { useEffect, useState } from 'react'
import { StorefrontHeader } from '../../../components/layout/StorefrontHeader'
import { StorefrontFooter } from '../../../components/layout/StorefrontFooter'
import { Icon } from '../../../components/ui/Icon'
import { CollectionHero } from '../components/CollectionHero'
import { ProductCard } from '../components/ProductCard'
import { ProductPreview } from '../components/ProductPreview'
import { DemoBag } from '../components/DemoBag'
import { Editorial } from '../components/Editorial'
import { CatalogueFilters } from '../components/CatalogueFilters'
import { products } from '../data/mockCatalogue'
import { useDemoShop } from '../hooks/useDemoShop'
import type { Category, Product, SortOrder } from '../types'
import '../styles/catalogue.css'

export default function CataloguePage() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<Category>('all')
  const [sort, setSort] = useState<SortOrder>('editorial')
  const [showNotes, setShowNotes] = useState(true)
  const [savedOnly, setSavedOnly] = useState(false)
  const [maxPrice, setMaxPrice] = useState(550)
  const [filterSize, setFilterSize] = useState('all')
  const [preview, setPreview] = useState<Product | null>(null)
  const [bagOpen, setBagOpen] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const shop = useDemoShop()
  const bagCount = shop.bag.reduce((sum, item) => sum + item.quantity, 0)
  const hasFilters =
    query !== '' ||
    category !== 'all' ||
    savedOnly ||
    maxPrice < 550 ||
    filterSize !== 'all'
  const visibleProducts = products
    .filter(
      (product) =>
        (category === 'all' || product.category === category) &&
        `${product.name} ${product.description}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()) &&
        (!savedOnly || shop.favorites.includes(product.id)) &&
        product.price <= maxPrice &&
        (filterSize === 'all' || product.sizes.includes(filterSize)),
    )
    .sort((a, b) =>
      sort === 'price-asc'
        ? a.price - b.price
        : sort === 'price-desc'
          ? b.price - a.price
          : sort === 'match'
            ? b.match - a.match
            : 0,
    )

  useEffect(() => {
    document.title = 'Spring Architecture — StyleFit'
    return () => {
      document.title = 'StyleFit'
    }
  }, [])

  useEffect(() => {
    if (!announcement) return
    const timer = window.setTimeout(() => setAnnouncement(''), 4500)
    return () => window.clearTimeout(timer)
  }, [announcement])

  function resetFilters() {
    setQuery('')
    setCategory('all')
    setSavedOnly(false)
    setMaxPrice(550)
    setFilterSize('all')
  }
  function addProduct(product: Product, size: string) {
    shop.addToBag(product.id, size)
    setAnnouncement(`${product.name} · Size ${size} added to your demo bag.`)
  }

  return (
    <div className="storefront">
      <StorefrontHeader query={query} onSearch={setQuery} bagCount={bagCount} />
      <main id="catalogue-content" className="store-main" tabIndex={-1}>
        <div className="curatorial-bar">
          <div className="store-container">
            <span>
              <i /> <strong>Édition Printemps</strong>
              <span className="bar-divider">/</span> A study in modern
              silhouettes
            </span>
            <span>
              <Icon name="sparkles" size={13} /> Frontend preview · Sample
              collection
            </span>
          </div>
        </div>
        <div className="store-container catalogue-body">
          <CollectionHero />
          <section
            className="wardrobe-banner"
            aria-label="Sample wardrobe pairing notes"
          >
            <div className="wardrobe-copy">
              <span className="wardrobe-icon">
                <Icon name="wardrobe" size={25} />
              </span>
              <div>
                <h2>
                  Style starts with what you love{' '}
                  <span className="small-badge">Demo</span>
                </h2>
                <p>
                  Explore sample wardrobe pairings. Match scores are
                  illustrative; your personal wardrobe isn’t connected.
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
              <span>Pairing notes: {showNotes ? 'On' : 'Off'}</span>
            </label>
          </section>
          <section
            id="collection"
            className="collection-section"
            aria-label="Shop the collection"
          >
            <CatalogueFilters
              category={category}
              setCategory={setCategory}
              sort={sort}
              setSort={setSort}
              maxPrice={maxPrice}
              setMaxPrice={setMaxPrice}
              filterSize={filterSize}
              setFilterSize={setFilterSize}
              savedOnly={savedOnly}
              setSavedOnly={setSavedOnly}
              favoriteCount={shop.favorites.length}
              resetFilters={resetFilters}
            />
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
                {visibleProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    favorite={shop.favorites.includes(product.id)}
                    showNotes={showNotes}
                    onFavorite={shop.toggleFavorite}
                    onAdd={addProduct}
                    onPreview={setPreview}
                  />
                ))}
              </div>
            ) : (
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
                  Show all garments
                </button>
              </div>
            )}
          </section>
          <Editorial />
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
                setBagOpen(true)
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
      {shop.storageError && (
        <div className="storage-notice" role="alert">
          Your browser couldn’t save these changes. They’ll last for this visit
          only.
        </div>
      )}
      {preview && (
        <ProductPreview
          product={preview}
          onClose={() => setPreview(null)}
          onAdd={addProduct}
        />
      )}
      {bagOpen && (
        <DemoBag
          items={shop.bag}
          onClose={() => setBagOpen(false)}
          onQuantity={shop.setQuantity}
        />
      )}
    </div>
  )
}
