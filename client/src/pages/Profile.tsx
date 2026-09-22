import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSession } from '../features/auth/sessionContext'
import { shopApi, type Profile as ProfileData } from '../services/shopApi'
import { Icon } from '../components/ui/Icon'
import { AccountLayout } from './AccountLayout'
import '../features/products/styles/catalogue.css'
import './profile.css'

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
    if (busy) return
    setBusy(true); setMessage(''); setError('')
    try {
      await shopApi.updateProfile({ name: name.trim(), height_cm: details.height_cm ? Number(details.height_cm) : null,
        weight_kg: details.weight_kg ? Number(details.weight_kg) : null, body_shape: details.body_shape.trim() || null,
        clothing_size: details.clothing_size.trim() || null, skin_tone: details.skin_tone.trim() || null })
      setProfile((current) => current ? { ...current, name: name.trim() } : current)
      setMessage('Your profile has been saved.')
    } catch (error) { setError(error instanceof Error ? error.message : 'Unable to save.') }
    finally { setBusy(false) }
  }
  return <AccountLayout title="My account" description="A few details. A more personal wardrobe." profile={profile}>
          {(loading || (!profile && !error)) && <p className="profile-notice" role="status">Loading your profile...</p>}
          {error && <p role="alert" className="profile-notice profile-error">{error}</p>}
          {profile?.user_id === userId && <form onSubmit={save}>
            <fieldset disabled={busy}>
              <section className="account-detail-card" aria-labelledby="personal-title">
                <div className="profile-section-heading"><span className="profile-section-icon"><Icon name="edit" size={20} /></span><div><h2 id="personal-title">Personal details</h2><p>How we know you, and where you sign in.</p></div></div>
                <div className="profile-fields"><label htmlFor="profile-name">Your name<input id="profile-name" autoComplete="name" value={name} onChange={(event) => { setName(event.target.value); setMessage('') }} required maxLength={120} /></label>
                  <label>Email address<input type="email" value={session?.user.email ?? ''} readOnly autoComplete="email" /><small>Your sign-in email</small></label></div>
              </section>
              <section className="account-detail-card" aria-labelledby="style-title">
                <div className="profile-section-heading"><span className="profile-section-icon"><Icon name="ruler" size={20} /></span><div><h2 id="style-title">Your style & fit</h2><p>Optional details for more personal styling suggestions.</p></div><span className="profile-optional">Optional</span></div>
                <div className="profile-privacy"><Icon name="lock" size={17} /><p>Used in an AI check only when you choose to include your saved profile.</p></div>
                <div className="profile-fields">
                  {([['height_cm', 'Height (cm)', 'e.g. 170'], ['weight_kg', 'Weight (kg)', 'e.g. 65'], ['clothing_size', 'Clothing size', 'e.g. M or EU 38'], ['body_shape', 'Body shape', 'Describe in your own words'], ['skin_tone', 'Skin tone', 'Describe in your own words']] as const).map(([field, label, placeholder]) => <label key={field}>{label}<input type={field === 'height_cm' || field === 'weight_kg' ? 'number' : 'text'} step="any" min="1" max={field === 'height_cm' ? 300 : field === 'weight_kg' ? 700 : undefined} maxLength={120} placeholder={placeholder} value={details[field]} onChange={(event) => { setDetails({ ...details, [field]: event.target.value }); setMessage('') }} /></label>)}
                </div>
                <button type="button" className="profile-clear" onClick={() => { setDetails(blankDetails); setMessage('Optional details cleared from the form. Save your profile to apply.') }}>Clear optional details</button>
              </section>
              <div className="profile-save"><p role="status">{message || 'Your changes are saved when you select Save profile.'}</p><button className="button button-primary" disabled={busy || !name.trim()}>{busy ? 'Saving...' : 'Save profile'}<Icon name="check" size={17} /></button></div>
            </fieldset>
          </form>}
          <section className="account-detail-card profile-security"><span className="profile-section-icon"><Icon name="lock" size={20} /></span><div><h2>Account security</h2><p>Keep your account protected with a strong password.</p></div><Link className="button button-surface" to="/reset-password">Change password<Icon name="arrow" size={16} /></Link></section>
  </AccountLayout>
}
