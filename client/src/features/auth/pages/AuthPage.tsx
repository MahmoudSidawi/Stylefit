import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
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
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [values, setValues] = useState<AuthValues>(emptyValues)
  const [errors, setErrors] = useState<AuthErrors>({})
  const [reviewed, setReviewed] = useState(false)
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
    setMode(next)
    setValues(emptyValues)
    setErrors({})
    setReviewed(false)
  }
  function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const next = validateAuth(values, mode)
    setErrors(next)
    const first = Object.keys(next)[0]
    if (first) {
      document.getElementById(`auth-${first}`)?.focus()
      return
    }
    setValues(emptyValues)
    setReviewed(true)
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
                <h2>Preview complete.</h2>
                <p>
                  {reset
                    ? 'The email format is valid. Password recovery is not connected, so no email was sent.'
                    : register
                      ? 'Your form passed validation. Account creation is not connected yet, so no account was created.'
                      : 'Your form passed validation. Authentication is not connected yet, so you have not been signed in.'}{' '}
                  Your entries have been cleared.
                </p>
                <Link className="button button-primary" to="/catalogue">
                  Explore as a guest <Icon name="arrow" size={16} />
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
                <div className="auth-preview-note">
                  <Icon name="info" size={16} />
                  <p>
                    Frontend preview ·{' '}
                    {reset
                      ? 'Recovery emails are not sent.'
                      : 'Accounts are not connected yet.'}{' '}
                    Use sample details; nothing is saved or sent.
                  </p>
                </div>
                <button
                  className="button button-primary auth-submit"
                  type="submit"
                >
                  {register
                    ? 'Create account'
                    : reset
                      ? 'Preview recovery'
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
