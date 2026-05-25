// Sources:
// - React useState: https://react.dev/reference/react/useState
// - React Router Link: https://reactrouter.com/en/main/components/link
// - React Router useNavigate: https://reactrouter.com/en/main/hooks/use-navigate
// - Date object (age calculation): https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date
// - HTML input type="date": https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/date
// - HTML input max attribute: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#max
// - HTML autocomplete attribute: https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/autocomplete
// - Date.toISOString: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register as registerApi } from '../api/users'
import ErrorMessage from '../components/ui/ErrorMessage'

// Calculates the user's current age from a date-of-birth string
// Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date
function calcAge(dob) {
  const today = new Date()
  const birth = new Date(dob)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

// Registration form — validates age (18+), matching passwords, and terms agreement,
// then registers and immediately logs the user in.
export default function RegisterPage() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    dob: '',
    agreed: false,
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  // Generic change handler — works for both text inputs and the checkbox
  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      return setError('Passwords do not match.')
    }
    if (form.password.length < 8) {
      return setError('Password must be at least 8 characters.')
    }
    if (!/[0-9]/.test(form.password)) {
      return setError('Password must contain at least one number.')
    }
    if (!form.dob) {
      return setError('Date of birth is required.')
    }
    if (calcAge(form.dob) < 18) {
      return setError('You must be at least 18 years old to register.')
    }
    if (!form.agreed) {
      return setError('You must agree to the terms and conditions.')
    }

    setLoading(true)
    try {
      await registerApi({
        username: form.username,
        email: form.email,
        password: form.password,
        age: calcAge(form.dob),
      })
      setSuccess(true)
    } catch (err) {
      const msg = err.response?.data?.errors?.[0]
        ?? err.response?.data?.message
        ?? 'Registration failed. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div style={styles.page}>
        <div className="card" style={styles.card}>
          <Link to="/" style={styles.backLink}>← Spanish Poker Dice</Link>
          <h1 style={styles.heading}>Check your email</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            We sent a verification link to <strong>{form.email}</strong>.
            Click the link in the email to activate your account, then log in.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/login')}>
            Go to login
          </button>
          <p style={styles.footer}>
            Didn't get the email?{' '}
            <Link to="/resend-verification">Resend verification</Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <div className="card" style={styles.card}>

        <Link to="/" style={styles.backLink}>← Spanish Poker Dice</Link>
        <h1 style={styles.heading}>Create account</h1>

        <ErrorMessage message={error} />

        <form onSubmit={handleSubmit} style={styles.form}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              value={form.username}
              onChange={handleChange}
              required
              minLength={3}
              placeholder="At least 3 characters"
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={8}
              placeholder="At least 8 characters, must include a number"
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Repeat your password"
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="dob">Date of birth <span style={styles.hint}>(must be 18+)</span></label>
            <input
              id="dob"
              name="dob"
              type="date"
              value={form.dob}
              onChange={handleChange}
              required
              max={new Date(new Date().setFullYear(new Date().getFullYear() - 18))
                .toISOString().split('T')[0]}
            />
          </div>

          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="agreed"
              checked={form.agreed}
              onChange={handleChange}
              style={styles.checkbox}
            />
            I agree to the{' '}
            <Link to="/terms" target="_blank" rel="noopener noreferrer">
              Terms and Conditions
            </Link>
          </label>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p style={styles.footer}>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg)',
    padding: '1.5rem',
  },
  card: {
    width: '100%',
    maxWidth: 440,
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  backLink: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    textDecoration: 'none',
  },
  heading: {
    fontSize: '1.75rem',
    marginBottom: '0.25rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  hint: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    fontWeight: 400,
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.875rem',
    color: 'var(--text)',
    cursor: 'pointer',
    marginTop: '0.5rem',
  },
  checkbox: {
    width: 'auto',
    accentColor: 'var(--accent)',
  },
  footer: {
    fontSize: '0.875rem',
    color: 'var(--text-muted)',
    textAlign: 'center',
    marginTop: '0.5rem',
  },
}
