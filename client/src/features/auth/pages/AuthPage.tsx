import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getSupabaseClient } from '../../../services/supabase'
import { Icon } from '../../../components/ui/Icon'
import { AuthField } from '../components/AuthField'
import {
  validateAuth,
  type AuthErrors,
  type AuthMode,
  type AuthValues,
} from '../utils/validateAuth'
import hero from '../../../assets/storefront/hero.jpg'
import '../../../features/products/styles/catalogue.css'
import '../styles/auth.css'

const emptyValues: AuthValues = {
  name: '',
  email: '',
  password: '',
  confirm: '',
}

export default function AuthPage({
  initialMode,
}: {
  initialMode: 'login' | 'register'
}) {
  const location = useLocation()
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [values, setValues] = useState<AuthValues>(emptyValues)
  const [errors, setErrors] = useState<AuthErrors>({})
  const [reviewed, setReviewed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [requestError, setRequestError] = useState(location.state?.message || '')
  const [message, setMessage] = useState('')
  const resultRef = useRef<HTMLDivElement>(null)
  const register = mode === 'register'
  const reset = mode === 'reset'
  useEffect(() => {
    document.title = `${register ? 'Create an account' : reset ? 'Reset password' : 'Welcome back'} — StyleFit`
    return () => {
      document.title = 'StyleFit'
    }
  }, [register, reset])
  useEffect(() => {
    if (reviewed) resultRef.current?.focus()
  }, [reviewed])
  function update(name: keyof AuthValues, value: string) {
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({
      ...current,
      [name]: undefined,
      ...(name === 'password' ? { confirm: undefined } : {}),
    }))
  }
  function changeMode(next: AuthMode) {
    setRequestError('')
    setMode(next)
    setValues(emptyValues)
    setErrors({})
    setReviewed(false)
  }
  async function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    setRequestError('')
    const next = validateAuth(values, mode)
    setErrors(next)
    const first = Object.keys(next)[0]
    if (first) {
      document.getElementById(`auth-${first}`)?.focus()
      return
    }
    setBusy(true)
    try {
      const client = getSupabaseClient()
      if (reset) {
        const { error } = await client.auth.resetPasswordForEmail(values.email.trim(), { redirectTo: `${window.location.origin}/reset-password` })
        if (error) throw error
        setMessage('If an account exists for this email, a password reset link will arrive shortly.')
      } else if (register) {
        const { data, error } = await client.auth.signUp({ email: values.email.trim(), password: values.password,
          options: { data: { name: values.name.trim() }, emailRedirectTo: `${window.location.origin}/profile` } })
        if (error) throw error
        setMessage(data.session ? 'Your account is ready. You are signed in.' : 'Check your email to confirm your account, then sign in.')
      } else {
        const { error } = await client.auth.signInWithPassword({ email: values.email.trim(), password: values.password })
        if (error) throw error
        setMessage('You are signed in to StyleFit.')
      }
      setValues(emptyValues)
      setReviewed(true)
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : 'Unable to connect. Please retry.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <div
      className={`storefront auth-page auth-compact${initialMode === 'register' ? ' auth-register' : ''}`}
    >
      <a className="skip-link" href="#auth-content">
        Skip to form
      </a>
      <header className="auth-header">
        <Link
          className="store-brand"
          to="/catalogue"
          aria-label="StyleFit storefront"
        >
          <span className="brand-mark" aria-hidden="true">
            sf.
          </span>
          <span>StyleFit</span>
        </Link>
        <span className="auth-header-note">
          A more personal perspective on style.
        </span>
        <Link className="auth-back" to="/catalogue">
          Explore the collection <Icon name="arrow" size={16} />
        </Link>
      </header>
      <main className="auth-main" id="auth-content" tabIndex={-1}>
        <section className="auth-editorial" aria-label="The StyleFit atelier">
          <img
            className="auth-hero"
            src={hero}
            alt="Warm sunlight in an atelier, with a tailored terracotta suit"
          />
          <div className="auth-image-shade" />
          <div className="auth-editorial-top">
            <span>THE STYLEFIT ATELIER</span>
            <span>EST. 2026</span>
          </div>
          <div className="auth-editorial-copy">
            <span className="auth-kicker">
              Considered pieces. Endless possibilities.
            </span>
            <h2>
              Your style.
              <br />A little more <em>you.</em>
            </h2>
            <p>
              A wardrobe with intention. New combinations.
              <br />A fresh perspective, every day.
            </p>
          </div>
          <div className="auth-editorial-bottom">
            <span>
              <Icon name="sparkles" size={17} /> A considered way to get dressed
            </span>
            <span>THE EVERYDAY EDIT</span>
          </div>
        </section>
        <section className="auth-form-panel" aria-labelledby="auth-title">
          <div className="auth-form-inner">
            <span className="auth-emblem">
              <Icon
                name={register ? 'hanger' : reset ? 'lock' : 'sparkles'}
                size={25}
              />
            </span>
            <p className="auth-kicker">YOUR PERSONAL STYLE SPACE</p>
            <h1 id="auth-title">
              {register
                ? 'A new chapter in style.'
                : reset
                  ? 'A fresh start.'
                  : 'Welcome back.'}
            </h1>
            <p className="auth-intro">
              {register
                ? 'Make room for a wardrobe that feels like you.'
                : reset
                  ? 'Let’s help you find your way back to your wardrobe.'
                  : 'Good to see you again. Your next great look is waiting.'}
            </p>
            {!reset && (
              <nav className="auth-switch" aria-label="Account access">
                <Link to="/login" aria-current={!register ? 'page' : undefined}>
                  Sign in
                </Link>
                <Link
                  to="/register"
                  aria-current={register ? 'page' : undefined}
                >
                  Create account
                </Link>
              </nav>
            )}
            {reviewed ? (
              <div
                className="auth-result"
                ref={resultRef}
                tabIndex={-1}
                role="status"
              >
                <Icon name="check" size={26} />
                <h2>{reset ? 'Check your inbox' : register ? 'Account registration' : 'Welcome back'}</h2>
                <p>{message}</p>
                <Link className="button button-primary" to={reset ? '/login' : '/profile'}>
                  {reset ? 'Back to sign in' : 'Your account'} <Icon name="arrow" size={16} />
                </Link>
                <button
                  className="auth-text-button"
                  onClick={() => setReviewed(false)}
                >
                  Back to form
                </button>
              </div>
            ) : (
              <form className="auth-form" noValidate onSubmit={submit}>
                {register && (
                  <AuthField
                    name="name"
                    label="Full name"
                    value={values.name}
                    onChange={(value) => update('name', value)}
                    error={errors.name}
                    autoComplete="name"
                  />
                )}
                <AuthField
                  name="email"
                  label="Email address"
                  type="email"
                  value={values.email}
                  onChange={(value) => update('email', value)}
                  error={errors.email}
                  autoComplete="email"
                />
                {!reset && (
                  <AuthField
                    name="password"
                    label="Password"
                    type="password"
                    value={values.password}
                    onChange={(value) => update('password', value)}
                    error={errors.password}
                    autoComplete={
                      register ? 'new-password' : 'current-password'
                    }
                    hint={register ? 'Use at least 8 characters.' : undefined}
                  />
                )}
                {register && (
                  <AuthField
                    name="confirm"
                    label="Confirm password"
                    type="password"
                    value={values.confirm}
                    onChange={(value) => update('confirm', value)}
                    error={errors.confirm}
                    autoComplete="new-password"
                  />
                )}
                {!register && !reset && (
                  <button
                    className="auth-text-button auth-forgot"
                    type="button"
                    onClick={() => changeMode('reset')}
                  >
                    Forgot your password?
                  </button>
                )}
                {requestError && <p role="alert" className="auth-preview-note">{requestError}</p>}
                <button
                  className="button button-primary auth-submit"
                  disabled={busy}
                  type="submit"
                >
                  {register
                    ? 'Create account'
                    : reset
                      ? 'Send reset link'
                      : 'Sign in'}
                  <Icon name="arrow" size={18} />
                </button>
                {reset && (
                  <button
                    className="auth-text-button auth-return"
                    type="button"
                    onClick={() => changeMode('login')}
                  >
                    Back to sign in
                  </button>
                )}
              </form>
            )}
            <div className="auth-guest">
              <span>Just looking around?</span>
              <Link to="/catalogue">
                Continue as a guest <Icon name="arrow" size={14} />
              </Link>
            </div>
            <div className="auth-benefits">
              <span>
                <Icon name="wardrobe" size={17} />
                Your wardrobe
              </span>
              <span>
                <Icon name="heart" size={17} />
                Your favorites
              </span>
              <span>
                <Icon name="sparkles" size={17} />
                Your inspiration
              </span>
            </div>
          </div>
        </section>
      </main>
      <footer className="auth-footer">
        <span>© {new Date().getFullYear()} StyleFit Studio</span>
        <span>A considered wardrobe. A personal point of view.</span>
        <Link to="/matcher">
          Discover the outfit studio <Icon name="arrow" size={13} />
        </Link>
      </footer>
    </div>
  )
}
