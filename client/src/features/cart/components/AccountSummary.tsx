import type { ReactNode } from 'react'
import type { CartRecord } from '../../../services/shopApi'
import { formatMoney } from '../../../utils/currency'
export function AccountSummary({ rows, children }: { rows: CartRecord[]; children: ReactNode }) {
  const count = rows.reduce((sum, row) => sum + row.quantity, 0)
  const total = rows.reduce((sum, row) => sum + Number(row.product_variants?.price ?? 0) * row.quantity, 0)
  return <aside className="order-summary" aria-labelledby="summary-title">
    <div className="order-summary-heading"><h2 id="summary-title">Order Summary</h2><span>{count} selected</span></div>
    <dl className="summary-lines"><div><dt>Items subtotal</dt><dd>{formatMoney(total)}</dd></div><div><dt>Delivery</dt><dd>Complimentary</dd></div><div><dt>Payment</dt><dd>Cash on delivery</dd></div></dl>
    <div className="summary-total"><div><h3>Total</h3><p>USD</p></div><strong>{formatMoney(total)}</strong></div>
    {children}<div className="summary-note"><p>Prices and availability are checked again when you place your order.</p></div>
  </aside>
}
