// Sources:
// - React useState: https://react.dev/reference/react/useState
// - React Router Link: https://reactrouter.com/en/main/components/link

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { resendVerification } from '../api/users'
import ErrorMessage from '../components/ui/ErrorMessage'

// Lets unverified users request a new verification email.
export default function ResendVerificationPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await resendVerification({ email })
      setSuccess(true)
    } catch (err) {
      setError(
        err.response?.data?.message ?? 'Failed to resend. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div className="card" style={styles.card}>
        <Link to="/" style={styles.backLink}>← Spanish Poker Dice</Link>
        <h1 style={styles.heading}>Resend verification email</h1>

        {success ? (
          <>
            <p style={styles.sub}>
              A new verification link has been sent. Check your inbox and click the link to activate your account.
            </p>
            <Link to="/login" className="btn btn-primary" style={{ textAlign: 'center' }}>
              Back to login
            </Link>
          </>
        ) : (
          <>
            <p style={styles.sub}>
              Enter your email address and we'll send you a new verification link.
            </p>
            <ErrorMessage message={error} />
            <form onSubmit={handleSubmit} style={styles.form}>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send verification email'}
              </button>
            </form>
            <p style={styles.footer}>
              Already verified? <Link to="/login">Log in</Link>
            </p>
          </>
        )}
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
    maxWidth: 420,
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  backLink: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    textDecoration: 'none',
  },
  heading: { fontSize: '1.75rem', marginBottom: '0.25rem' },
  sub: { color: 'var(--text-muted)', fontSize: '0.95rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '0.25rem' },
  footer: { fontSize: '0.875rem', color: 'var(--text-muted)', textAlign: 'center' },
}
