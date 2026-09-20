import { Link } from 'react-router-dom'
import { Dialog } from '../../../components/ui/Dialog'
import { Icon } from '../../../components/ui/Icon'
import { formatMoney } from '../../../utils/currency'
import type { OrderPreview } from '../types'

export function OrderPreviewDialog({
  preview,
  onClose,
}: {
  preview: OrderPreview
  onClose: () => void
}) {
  return (
    <Dialog title="Your order preview is ready" onClose={onClose}>
      <div className="order-preview">
        <span className="order-preview-icon">
          <Icon name="check" size={28} />
        </span>
        <p>
          This is a review of your selections. Nothing has been purchased,
          charged, or sent, and your bag is still available.
        </p>
        <dl>
          <div>
            <dt>Prepared for</dt>
            <dd>
              {preview.details.firstName} {preview.details.lastName}
            </dd>
          </div>
          <div>
            <dt>Contact</dt>
            <dd>{preview.details.email}</dd>
          </div>
          <div>
            <dt>Delivery address</dt>
            <dd>
              {preview.details.address}
              {preview.details.apartment
                ? `, ${preview.details.apartment}`
                : ''}
              <br />
              {preview.details.city}, {preview.details.country}
              {preview.details.postalCode
                ? ` · ${preview.details.postalCode}`
                : ''}
            </dd>
          </div>
          <div>
            <dt>Delivery</dt>
            <dd>
              {preview.delivery === 'express' ? 'Express' : 'Standard'} · Sample
              rate
            </dd>
          </div>
          <div>
            <dt>{preview.itemCount} items · Estimated total</dt>
            <dd>
              <strong>{formatMoney(preview.total)}</strong>
              <small>Excludes uncalculated taxes and duties.</small>
            </dd>
          </div>
        </dl>
        <button className="button button-primary full-width" onClick={onClose}>
          Edit checkout details
        </button>
        <Link
          className="button button-surface full-width"
          to="/catalogue"
          onClick={onClose}
        >
          Continue exploring
        </Link>
      </div>
    </Dialog>
  )
}
