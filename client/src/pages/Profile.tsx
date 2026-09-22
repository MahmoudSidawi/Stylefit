import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSession } from '../features/auth/sessionContext'
import { getSupabaseClient } from '../services/supabase'
import { shopApi, type Profile as ProfileData } from '../services/shopApi'

export default function Profile() {
  const { session, loading } = useSession()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [name, setName] = useState('')
  const blankDetails = { height_cm: '', weight_kg: '', body_shape: '', clothing_size: '', skin_tone: '' }
  const [details, setDetails] = useState(blankDetails)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const userId = session?.user.id
  useEffect(() => {
    let active = true
    if (userId) shopApi.me().then((data) => {
      if (active) {
        setProfile(data); setName(data.name)
        setDetails({ height_cm: data.height_cm?.toString() ?? '', weight_kg: data.weight_kg?.toString() ?? '',
          body_shape: data.body_shape ?? '', clothing_size: data.clothing_size ?? '', skin_tone: data.skin_tone ?? '' })
      }
    }).catch((error: unknown) => {
      if (active) setError(error instanceof Error ? error.message : 'Unable to load your profile.')
    })
    return () => { active = false }
  }, [userId])
  async function save(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true); setMessage(''); setError('')
    try {
      await shopApi.updateProfile({ name: name.trim(), height_cm: details.height_cm ? Number(details.height_cm) : null,
        weight_kg: details.weight_kg ? Number(details.weight_kg) : null, body_shape: details.body_shape.trim() || null,
        clothing_size: details.clothing_size.trim() || null, skin_tone: details.skin_tone.trim() || null })
      setMessage('Your profile has been saved.')
    } catch (error) { setError(error instanceof Error ? error.message : 'Unable to save.') }
    finally { setBusy(false) }
  }
  async function signOut() {
    setBusy(true); setError('')
    try {
      const { error } = await getSupabaseClient().auth.signOut()
      if (error) throw error
      setProfile(null)
    } catch (error) { setError(error instanceof Error ? error.message : 'Unable to sign out.') }
    finally { setBusy(false) }
  }
  if (loading) return <p role="status">Loading your account…</p>
  if (!session) return <section><h1>Your account</h1><p><Link to="/login">Sign in</Link> to manage your profile.</p></section>
  return <section style={{ maxWidth: 600 }}>
    <p>{session.user.email}</p>
    {profile?.user_id === userId && <form className="live-form" onSubmit={save}>
      <label htmlFor="profile-name">Your name</label>{' '}
      <input id="profile-name" value={name} onChange={(event) => setName(event.target.value)} required maxLength={120} />{' '}
      <p>These details are optional. AI matching uses them only when you select “Include my saved optional body details” for a check.</p>
      {([['height_cm', 'Height (cm)'], ['weight_kg', 'Weight (kg)'], ['body_shape', 'Body shape'], ['clothing_size', 'Clothing size'], ['skin_tone', 'Skin tone']] as const).map(([field, label]) =>
        <label key={field}>{label}<input type={field === 'height_cm' || field === 'weight_kg' ? 'number' : 'text'} step="any" min="1" max={field === 'height_cm' ? 300 : field === 'weight_kg' ? 700 : undefined} maxLength={120} value={details[field]} onChange={(e) => setDetails({ ...details, [field]: e.target.value })} /></label>)}
      <button type="button" className="button button-surface" onClick={() => setDetails(blankDetails)}>Clear optional details</button>
      <button className="button button-primary" disabled={busy || !name.trim()}>Save profile</button>
    </form>}
    {message && <p role="status">{message}</p>}
    {error && <p role="alert">{error}</p>}
    <p><button onClick={signOut} disabled={busy}>Sign out</button></p>
  </section>
}
