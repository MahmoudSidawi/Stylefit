import { DepartmentFilter, type DepartmentSelection } from '../../../components/ui/DepartmentFilter'
import { useState } from 'react'
import { Icon } from '../../../components/ui/Icon'
import type { Category, Product } from '../types'

type Props = {
  categories: { id: Category; label: string; description?: string }[]
  products: Product[]
  department: DepartmentSelection
  setDepartment: (value: DepartmentSelection) => void
  category: Category
  setCategory: (category: Category) => void
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
  categories,
  products,
  department,
  setDepartment,
  category,
  setCategory,
  maxPrice,
  setMaxPrice,
  filterSize,
  setFilterSize,
  savedOnly,
  setSavedOnly,
  favoriteCount,
  resetFilters,
}: Props) {
  const [open, setOpen] = useState(false)
  return (
    <aside className="clothes-sidebar" aria-label="Clothing filters">
      <button
        className="clothes-filter-toggle"
        aria-expanded={open}
        aria-controls="clothes-filter-panel"
        onClick={() => setOpen(!open)}
      >
        <Icon name="sliders" />
        {open ? 'Hide filters' : 'Show filters'}
        <Icon name={open ? 'close' : 'plus'} size={16} />
      </button>
      <div
        id="clothes-filter-panel"
        className={`clothes-filter-panel${open ? ' is-open' : ''}`}
      >
        <div className="clothes-filter-heading">
          <h2>
            <Icon name="sliders" size={18} /> Filters
          </h2>
          <button className="text-button" onClick={resetFilters}>
            Reset all
          </button>
        </div>
        <DepartmentFilter value={department} onChange={setDepartment} />
        <fieldset className="clothes-filter-group">
          <legend>Category</legend>
          {categories.map((item) => (
            <label
              className={`clothes-category${category === item.id ? ' selected' : ''}`}
              key={item.id}
              title={item.description}
            >
              <input
                type="radio"
                name="clothing-category"
                value={item.id}
                checked={category === item.id}
                onChange={() => setCategory(item.id)}
              />
              <span>{item.label}</span>
              <small>
                {
                  products.filter(
                    (product) =>
                      item.id === 'all' || product.category === item.id,
                  ).length
                }
              </small>
            </label>
          ))}
        </fieldset>
        <fieldset className="clothes-filter-group">
          <legend>Price range</legend>
          <label className="clothes-price" htmlFor="clothes-price">
            Up to <strong>${maxPrice}</strong>
          </label>
          <input
            id="clothes-price"
            type="range"
            min="0"
            max="100"
            step="10"
            value={maxPrice}
            onChange={(event) => setMaxPrice(Number(event.target.value))}
          />
          <div className="clothes-price-limits">
            <span>$0</span>
            <span>$100</span>
          </div>
        </fieldset>
        <fieldset className="clothes-filter-group">
          <legend>Size</legend>
          <div className="clothes-sizes">
            {[
              'all',
              ...new Set(products.flatMap((product) => product.sizes)),
            ].map((size) => (
              <button
                key={size}
                aria-pressed={filterSize === size}
                onClick={() => setFilterSize(size)}
              >
                {size === 'all' ? 'All sizes' : size}
              </button>
            ))}
          </div>
          <p>Sizes follow each garment’s label.</p>
        </fieldset>
        <fieldset className="clothes-filter-group">
          <legend>Your edit</legend>
          <label className="clothes-saved">
            <input
              type="checkbox"
              checked={savedOnly}
              onChange={(event) => setSavedOnly(event.target.checked)}
            />{' '}
            Saved only ({favoriteCount})
          </label>
        </fieldset>
        <div className="clothes-sidebar-note">
          <Icon name="hanger" size={25} />
          <h3>A wardrobe with intention.</h3>
          <p>Find the pieces that work beautifully together.</p>
        </div>
      </div>
    </aside>
  )
}
