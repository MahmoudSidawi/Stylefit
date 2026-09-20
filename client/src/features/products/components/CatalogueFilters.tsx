import { useState } from 'react'
import { Icon } from '../../../components/ui/Icon'
import { categories, products } from '../data/mockCatalogue'
import type { Category, SortOrder } from '../types'

type Props = {
  category: Category
  setCategory: (category: Category) => void
  sort: SortOrder
  setSort: (sort: SortOrder) => void
  maxPrice: number
  setMaxPrice: (price: number) => void
  filterSize: string
  setFilterSize: (size: string) => void
  savedOnly: boolean
  setSavedOnly: (savedOnly: boolean) => void
  favoriteCount: number
  resetFilters: () => void
}

export function CatalogueFilters({
  category,
  setCategory,
  sort,
  setSort,
  maxPrice,
  setMaxPrice,
  filterSize,
  setFilterSize,
  savedOnly,
  setSavedOnly,
  favoriteCount,
  resetFilters,
}: Props) {
  const [filtersOpen, setFiltersOpen] = useState(false)
  return (
    <>
      <div className="filter-toolbar">
        <div className="category-list" aria-label="Garment categories">
          {categories.map((item) => (
            <button
              key={item.id}
              className={`category-chip${category === item.id ? ' active' : ''}`}
              aria-pressed={category === item.id}
              onClick={() => setCategory(item.id)}
            >
              {item.label}{' '}
              <span>
                (
                {
                  products.filter(
                    (p) => item.id === 'all' || p.category === item.id,
                  ).length
                }
                )
              </span>
            </button>
          ))}
        </div>
        <div className="sort-tools">
          <label className="sort-field">
            <span>Sort:</span>
            <select
              value={sort}
              onChange={(event) => {
                const value = event.target.value
                if (
                  value === 'editorial' ||
                  value === 'match' ||
                  value === 'price-asc' ||
                  value === 'price-desc'
                )
                  setSort(value)
              }}
            >
              <option value="editorial">Editorial order</option>
              <option value="match">Sample match score</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </label>
          <button
            className={`icon-button filter-toggle${filtersOpen ? ' active' : ''}`}
            aria-label="More filters"
            aria-expanded={filtersOpen}
            aria-controls="additional-filters"
            onClick={() => setFiltersOpen(!filtersOpen)}
          >
            <Icon name="sliders" />
          </button>
        </div>
      </div>
      {filtersOpen && (
        <div id="additional-filters" className="additional-filters">
          <label className="price-filter">
            Maximum price: <strong>${maxPrice}</strong>
            <input
              type="range"
              min="150"
              max="550"
              step="10"
              value={maxPrice}
              onChange={(event) => setMaxPrice(Number(event.target.value))}
            />
          </label>
          <label className="size-filter">
            Size
            <select
              value={filterSize}
              onChange={(event) => setFilterSize(event.target.value)}
            >
              <option value="all">All sizes</option>
              {[...new Set(products.flatMap((product) => product.sizes))].map(
                (size) => (
                  <option key={size}>{size}</option>
                ),
              )}
            </select>
          </label>
          <label className="saved-filter">
            <input
              type="checkbox"
              checked={savedOnly}
              onChange={(event) => setSavedOnly(event.target.checked)}
            />{' '}
            Saved only ({favoriteCount})
          </label>
          <button className="text-button" onClick={resetFilters}>
            Reset filters
          </button>
        </div>
      )}
    </>
  )
}
