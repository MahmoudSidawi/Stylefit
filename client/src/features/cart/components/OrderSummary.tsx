import { useState } from 'react'
import type { ReactNode } from 'react'
import { Icon } from '../../../components/ui/Icon'
import { formatMoney } from '../../../utils/currency'
import { bagTotals } from '../utils/bagTotals'
import type { DeliveryMethod } from '../utils/bagTotals'
import type { BagItem } from '../../products/types'

export function OrderSummary({
  bag,
  promoCode = '',
  onPromo,
  delivery = 'standard',
  children,
}: {
  bag: BagItem[]
  promoCode?: string
  onPromo: (code: string) => void
  delivery?: DeliveryMethod
  children: ReactNode
}) {
  const totals = bagTotals(bag, promoCode, delivery)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  return (
    <aside className="order-summary" aria-labelledby="summary-title">
      <div className="order-summary-heading">
        <h2 id="summary-title">Order Summary</h2>
        <span>{totals.count} selected</span>
      </div>
      <dl className="summary-lines">
        <div>
          <dt>Items subtotal</dt>
          <dd>{formatMoney(totals.subtotal)}</dd>
        </div>
        {totals.discount > 0 && (
          <div className="summary-discount">
            <dt>
              <Icon name="sparkles" size={13} /> Demo welcome offer (10%)
            </dt>
            <dd>−{formatMoney(totals.discount)}</dd>
          </div>
        )}
        <div>
          <dt>
            {delivery === 'express' ? 'Express' : 'Standard'} delivery · Demo
          </dt>
          <dd>
            {totals.shipping ? formatMoney(totals.shipping) : 'Complimentary'}
          </dd>
        </div>
        <div>
          <dt>Taxes & duties</dt>
          <dd>Not calculated</dd>
        </div>
      </dl>
      <form
        className="promo-form"
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          if (code.trim().toUpperCase() !== 'DEMO10') {
            setError('Use DEMO10 to try the sample 10% discount.')
            return
          }
          onPromo('DEMO10')
          setCode('')
          setError('')
        }}
      >
        <label className="sr-only" htmlFor="promo-code">
          Promo code
        </label>
        <input
          id="promo-code"
          maxLength={30}
          value={code}
          placeholder="PROMO OR SALON CARD"
          aria-invalid={!!error}
          aria-describedby={error ? 'promo-error' : 'promo-hint'}
          onChange={(event) => {
            setCode(event.target.value)
            setError('')
          }}
          disabled={!bag.length || promoCode === 'DEMO10'}
        />
        <button type="submit" disabled={!bag.length || promoCode === 'DEMO10'}>
          Apply
        </button>
      </form>
      {error && (
        <p id="promo-error" className="commerce-error" role="alert">
          {error}
        </p>
      )}
      <p id="promo-hint" className="promo-hint">
        {promoCode === 'DEMO10' ? (
          <>
            DEMO10 applied{' '}
            <button onClick={() => onPromo('')}>Remove discount</button>
          </>
        ) : (
          'Try DEMO10 for a sample 10% discount.'
        )}
      </p>
      <div className="summary-total">
        <div>
          <h3>Estimated Total</h3>
          <p>USD · Demo prices, excluding tax</p>
        </div>
        <strong>{formatMoney(totals.total)}</strong>
      </div>
      {children}
      <div className="summary-note">
        <Icon name="info" size={16} />
        <p>
          This is a frontend preview. Delivery prices and discounts are
          examples. No payment or real order is processed.
        </p>
      </div>
    </aside>
  )
}
