import { useState } from 'react'

export function usePagination<T>(items: T[], pageSize: number, resetKey = '') {
  const [selection, setSelection] = useState({ key: resetKey, page: 1 })
  const pages = Math.max(1, Math.ceil(items.length / pageSize))
  const page = selection.key === resetKey ? Math.min(selection.page, pages) : 1
  // Commit resets and clamps so refreshed lists cannot jump back to an old page.
  if (selection.key !== resetKey || selection.page !== page) setSelection({ key: resetKey, page })
  const start = (page - 1) * pageSize
  return {
    items: items.slice(start, start + pageSize), page, pages, total: items.length,
    start: items.length ? start + 1 : 0, end: Math.min(start + pageSize, items.length),
    onPageChange: (next: number) => setSelection({ key: resetKey, page: Math.max(1, Math.min(next, pages)) }),
  }
}

