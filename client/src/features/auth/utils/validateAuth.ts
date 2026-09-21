export type AuthMode = 'login' | 'register' | 'reset'
export type AuthValues = {
  name: string
  email: string
  password: string
  confirm: string
}
export type AuthErrors = Partial<Record<keyof AuthValues, string>>

export function validateAuth(values: AuthValues, mode: AuthMode): AuthErrors {
  const errors: AuthErrors = {}
  if (mode === 'register' && values.name.trim().length < 2)
    errors.name = 'Enter your name (at least 2 characters).'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
    errors.email = 'Enter a valid email address.'
  if (mode !== 'reset' && !values.password)
    errors.password = 'Enter your password.'
  else if (mode === 'register' && values.password.length < 8)
    errors.password = 'Use at least 8 characters for your password.'
  if (
    mode === 'register' &&
    (!values.confirm || values.confirm !== values.password)
  )
    errors.confirm = 'Your passwords must match.'
  return errors
}
