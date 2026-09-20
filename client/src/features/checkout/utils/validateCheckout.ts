import type { CheckoutDetails, CheckoutErrors } from '../types'

export const emptyDetails: CheckoutDetails = {
  email: '',
  firstName: '',
  lastName: '',
  address: '',
  apartment: '',
  city: '',
  postalCode: '',
  country: 'Lebanon',
  phone: '',
}
export const sampleDetails: CheckoutDetails = {
  email: 'alex@example.com',
  firstName: 'Alex',
  lastName: 'Morgan',
  address: '12 Example Street',
  apartment: 'Apartment 4',
  city: 'Beirut',
  postalCode: '',
  country: 'Lebanon',
  phone: '',
}
export function validateCheckout(
  details: CheckoutDetails,
  acknowledged: boolean,
): CheckoutErrors {
  const errors: CheckoutErrors = {}
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email.trim()))
    errors.email = 'Enter a valid email address.'
  if (!details.firstName.trim()) errors.firstName = 'Enter a first name.'
  if (!details.lastName.trim()) errors.lastName = 'Enter a last name.'
  if (details.address.trim().length < 5)
    errors.address = 'Enter a street address with at least 5 characters.'
  if (!details.city.trim()) errors.city = 'Enter a city.'
  if (
    !['Lebanon', 'France', 'United States', 'United Kingdom'].includes(
      details.country,
    )
  )
    errors.country = 'Choose an available demo destination.'
  if (details.phone.trim() && !/^[+\d\s().-]{6,25}$/.test(details.phone))
    errors.phone = 'Enter a phone number, or leave this optional field blank.'
  if (!acknowledged)
    errors.acknowledged =
      'Confirm that you understand this is an order preview.'
  return errors
}
