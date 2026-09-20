import type { CheckoutDetails, CheckoutErrors } from '../types'
import type { DeliveryMethod } from '../../cart/utils/bagTotals'
import { Icon } from '../../../components/ui/Icon'
import { sampleDetails } from '../utils/validateCheckout'

type Props = {
  details: CheckoutDetails
  errors: CheckoutErrors
  onChange: (details: CheckoutDetails) => void
  delivery: DeliveryMethod
  onDelivery: (delivery: DeliveryMethod) => void
  acknowledged: boolean
  onAcknowledge: (value: boolean) => void
  standardShipping: number
}
const fields: {
  key: keyof CheckoutDetails
  label: string
  autoComplete: string
  type?: string
  optional?: boolean
  full?: boolean
}[] = [
  { key: 'firstName', label: 'First name', autoComplete: 'given-name' },
  { key: 'lastName', label: 'Last name', autoComplete: 'family-name' },
  {
    key: 'address',
    label: 'Street address',
    autoComplete: 'address-line1',
    full: true,
  },
  {
    key: 'apartment',
    label: 'Apartment, suite, etc.',
    autoComplete: 'address-line2',
    optional: true,
    full: true,
  },
  { key: 'city', label: 'City', autoComplete: 'address-level2' },
  {
    key: 'postalCode',
    label: 'Postal code',
    autoComplete: 'postal-code',
    optional: true,
  },
  {
    key: 'phone',
    label: 'Phone number',
    autoComplete: 'tel',
    type: 'tel',
    optional: true,
    full: true,
  },
]

export function CheckoutFields({
  details,
  errors,
  onChange,
  delivery,
  onDelivery,
  acknowledged,
  onAcknowledge,
  standardShipping,
}: Props) {
  return (
    <div className="checkout-fields">
      <section className="checkout-section">
        <div className="checkout-section-title">
          <h2>
            <span>01</span> Your details
          </h2>
          <button
            className="text-button"
            type="button"
            onClick={() => onChange({ ...sampleDetails })}
          >
            Use sample details
          </button>
        </div>
        <p>
          Use sample details to explore the form. Your contact and address
          entries stay on this page and are not saved or sent.
        </p>
        <label className="checkout-field" htmlFor="checkout-email">
          Email address
          <input
            id="checkout-email"
            type="email"
            autoComplete="email"
            maxLength={120}
            value={details.email}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'checkout-email-error' : undefined}
            onChange={(event) =>
              onChange({ ...details, email: event.target.value })
            }
          />
          {errors.email && (
            <span className="commerce-error" id="checkout-email-error">
              {errors.email}
            </span>
          )}
        </label>
      </section>
      <section className="checkout-section">
        <div className="checkout-section-title">
          <h2>
            <span>02</span> Delivery address
          </h2>
        </div>
        <div className="checkout-form-grid">
          {fields.map((field) => (
            <label
              key={field.key}
              className={`checkout-field${field.full ? ' field-full' : ''}`}
              htmlFor={`checkout-${field.key}`}
            >
              {field.label}
              {field.optional && <small>Optional</small>}
              <input
                id={`checkout-${field.key}`}
                type={field.type ?? 'text'}
                autoComplete={field.autoComplete}
                maxLength={
                  field.key === 'address' || field.key === 'apartment'
                    ? 150
                    : 70
                }
                value={details[field.key]}
                aria-invalid={!!errors[field.key]}
                aria-describedby={
                  errors[field.key] ? `checkout-${field.key}-error` : undefined
                }
                onChange={(event) =>
                  onChange({ ...details, [field.key]: event.target.value })
                }
              />
              {errors[field.key] && (
                <span
                  className="commerce-error"
                  id={`checkout-${field.key}-error`}
                >
                  {errors[field.key]}
                </span>
              )}
            </label>
          ))}
          <label
            className="checkout-field field-full"
            htmlFor="checkout-country"
          >
            Country / region
            <select
              id="checkout-country"
              autoComplete="country-name"
              value={details.country}
              onChange={(event) =>
                onChange({ ...details, country: event.target.value })
              }
            >
              {['Lebanon', 'France', 'United States', 'United Kingdom'].map(
                (country) => (
                  <option key={country}>{country}</option>
                ),
              )}
            </select>
            <span className="checkout-field-note">
              Sample destinations only. Delivery availability is not connected.
            </span>
          </label>
        </div>
      </section>
      <section className="checkout-section">
        <div className="checkout-section-title">
          <h2>
            <span>03</span> Delivery method
          </h2>
        </div>
        <fieldset className="delivery-options">
          <legend className="sr-only">Choose sample delivery</legend>
          {[
            {
              id: 'standard',
              title: 'Standard atelier delivery',
              detail: 'Sample estimate · 5–7 business days',
              price: standardShipping
                ? `$${standardShipping.toFixed(2)}`
                : 'Complimentary',
            },
            {
              id: 'express',
              title: 'Express delivery',
              detail: 'Sample estimate · 2–3 business days',
              price: '$25.00',
            },
          ].map((option) => (
            <label
              className={delivery === option.id ? 'selected' : ''}
              key={option.id}
            >
              <input
                type="radio"
                name="delivery"
                value={option.id}
                checked={delivery === option.id}
                onChange={() =>
                  onDelivery(option.id === 'express' ? 'express' : 'standard')
                }
              />
              <span>
                <strong>{option.title}</strong>
                <small>{option.detail}</small>
              </span>
              <b>{option.price}</b>
            </label>
          ))}
        </fieldset>
      </section>
      <section className="checkout-section payment-preview">
        <div className="checkout-section-title">
          <h2>
            <span>04</span> Payment preview
          </h2>
          <Icon name="lock" size={19} />
        </div>
        <p>
          Payment processing is not connected. You can review the complete order
          below without entering card or banking details.
        </p>
        <div className="payment-placeholder">
          <span>Card payment</span>
          <span>Coming soon</span>
        </div>
        <label className="checkout-acknowledgement">
          <input
            type="checkbox"
            checked={acknowledged}
            aria-invalid={!!errors.acknowledged}
            aria-describedby={
              errors.acknowledged ? 'acknowledgement-error' : undefined
            }
            onChange={(event) => onAcknowledge(event.target.checked)}
          />
          <span>
            I understand this is a demo preview. No payment or real order will
            be placed.
          </span>
        </label>
        {errors.acknowledged && (
          <p className="commerce-error" id="acknowledgement-error">
            {errors.acknowledged}
          </p>
        )}
      </section>
    </div>
  )
}
