import { useState } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../api/users'
import ErrorMessage from '../components/ui/ErrorMessage'

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [sent, setSent]       = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await forgotPassword(email)
      setSent(true)
    } catch (err) {
      setError(err.response?.data?.message ?? 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div style={styles.page}>
        <div className="card" style={styles.card}>
          <Link to="/login" style={styles.backLink}>← Back to login</Link>
          <h1 style={styles.heading}>Check your email</h1>
          <p style={styles.text}>
            If an account exists for <strong>{email}</strong>, a password reset
            link has been sent. Check your inbox and follow the link to reset your password.
          </p>
          <p style={styles.text}>The link expires in <strong>1 hour</strong>.</p>
          <Link to="/login" className="btn btn-primary" style={{ textAlign: 'center' }}>
            Back to login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <div className="card" style={styles.card}>
        <Link to="/login" style={styles.backLink}>← Back to login</Link>
        <h1 style={styles.heading}>Forgot password</h1>
        <p style={styles.text}>
          Enter your email address and we'll send you a link to reset your password.
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
              autoComplete="email"
              placeholder="you@example.com"
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? 'Sending…' : 'Send reset link'}
          </button>
        </form>

        <p style={styles.footer}>
          Remembered it? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--bg)', padding: '1.5rem',
  },
  card: {
    width: '100%', maxWidth: 420,
    display: 'flex', flexDirection: 'column', gap: '1rem',
  },
  backLink: { fontSize: '0.85rem', color: 'var(--text-muted)', textDecoration: 'none' },
  heading: { fontSize: '1.75rem', marginBottom: '0.25rem' },
  text: { fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.5 },
  form: { display: 'flex', flexDirection: 'column', gap: '0.25rem' },
  footer: { fontSize: '0.875rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.5rem' },
}