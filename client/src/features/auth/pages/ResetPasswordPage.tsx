import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSession } from '../sessionContext'
import { getSupabaseClient } from '../../../services/supabase'
import { AuthField } from '../components/AuthField'
import '../../products/styles/catalogue.css'
import '../styles/auth.css'

export default function ResetPasswordPage() {
  const { session, loading } = useSession()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  async function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    setError('')
    if (password.length < 8 || password !== confirm) {
      setError('Use at least 8 characters and enter the same password twice.')
      return
    }
    setBusy(true)
    try {
      const { error } = await getSupabaseClient().auth.updateUser({ password })
      if (error) throw error
      setDone(true)
      setPassword('')
      setConfirm('')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to update your password.')
    } finally { setBusy(false) }
  }
  return <main className="storefront auth-page" style={{ padding: '4rem 1.5rem' }}>
    <div className="auth-card" style={{ maxWidth: 460, margin: 'auto' }}>
      <h1>Set a new password</h1>
      {loading ? <p role="status">Checking your session…</p> : done ?
        <p role="status">Your password has been updated. <Link to="/profile">Your account</Link></p> :
        !session ? <p>This reset link is missing or expired. <Link to="/login">Request another link</Link>.</p> :
        <form className="auth-form" onSubmit={submit}>
          <AuthField name="password" label="New password" type="password" value={password} onChange={setPassword} autoComplete="new-password" />
          <AuthField name="confirm" label="Confirm password" type="password" value={confirm} onChange={setConfirm} autoComplete="new-password" />
          {error && <p role="alert">{error}</p>}
          <button className="button button-primary" disabled={busy}>{busy ? 'Saving…' : 'Save password'}</button>
        </form>}
      <p><Link to="/catalogue">Return to StyleFit</Link></p>
    </div>
  </main>
}
