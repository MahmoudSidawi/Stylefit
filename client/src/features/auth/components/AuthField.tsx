import { useState } from 'react'
import { Icon } from '../../../components/ui/Icon'

type Props = {
  name: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  type?: 'text' | 'email' | 'password'
  autoComplete: string
  hint?: string
}

export function AuthField({
  name,
  label,
  value,
  onChange,
  error,
  type = 'text',
  autoComplete,
  hint,
}: Props) {
  const [visible, setVisible] = useState(false)
  const id = `auth-${name}`
  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <div className={`auth-input-wrap${error ? ' has-error' : ''}`}>
        <input
          id={id}
          name={name}
          type={type === 'password' && visible ? 'text' : type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          required
          maxLength={type === 'password' ? 128 : 254}
          spellCheck={type === 'text'}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${id}-error` : hint ? `${id}-hint` : undefined
          }
        />
        {type === 'password' && (
          <button
            type="button"
            className="auth-reveal"
            aria-label={`${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}`}
            aria-pressed={visible}
            onClick={() => setVisible(!visible)}
          >
            <Icon name="eye" size={18} />
            <span>{visible ? 'Hide' : 'Show'}</span>
          </button>
        )}
      </div>
      {error ? (
        <p id={`${id}-error`} className="auth-error" role="alert">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="auth-hint">
            {hint}
          </p>
        )
      )}
    </div>
  )
}
