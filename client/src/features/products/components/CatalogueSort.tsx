import type { SortOrder } from '../types'

export function CatalogueSort({
  value,
  onChange,
}: {
  value: SortOrder
  onChange: (value: SortOrder) => void
}) {
  return (
    <label className="sort-field">
      <span>Sort by</span>
      <select
        value={value}
        onChange={(event) => {
          const sort = event.target.value
          if (
            sort === 'editorial' ||
            sort === 'match' ||
            sort === 'price-asc' ||
            sort === 'price-desc'
          )
            onChange(sort)
        }}
      >
        <option value="editorial">Editorial order</option>
        <option value="price-asc">Price: Low to High</option>
        <option value="price-desc">Price: High to Low</option>
        <option value="match">Sample match score</option>
      </select>
    </label>
  )
}
