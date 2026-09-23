import type { usePagination } from './usePagination'
import './pagination.css'

type Props = Pick<ReturnType<typeof usePagination>, 'page' | 'pages' | 'total' | 'start' | 'end' | 'onPageChange'>

export function Pagination({ page, pages, total, start, end, onPageChange }: Props) {
  if (!total) return null
  const numbers = Array.from({ length: pages }, (_, index) => index + 1)
    .filter((number) => number === 1 || number === pages || Math.abs(number - page) <= 1)
  return <nav className="collection-pagination" aria-label="Collection pagination">
    <p role="status">Showing {start}–{end} of {total} pieces · Page {page} of {pages}</p>
    {pages > 1 && <div className="pagination-controls">
      <button disabled={page === 1} onClick={() => onPageChange(page - 1)}>Previous</button>
      {numbers.map((number, index) => <span key={number}>
        {index > 0 && number - numbers[index - 1] > 1 && <span className="pagination-gap">…</span>}
        <button aria-label={`Page ${number}`} aria-current={number === page ? 'page' : undefined} onClick={() => onPageChange(number)}>{number}</button>
      </span>)}
      <button disabled={page === pages} onClick={() => onPageChange(page + 1)}>Next</button>
    </div>}
  </nav>
}
