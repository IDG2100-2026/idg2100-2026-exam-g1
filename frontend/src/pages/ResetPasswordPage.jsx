import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { resetPassword } from '../api/users'
import ErrorMessage from '../components/ui/ErrorMessage'

export default function ResetPasswordPage() {
  const { code } = useParams()
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password.length < 8) return setError('Password must be at least 8 characters.')
    if (!/[0-9]/.test(password)) return setError('Password must contain at least one number.')
    if (!/[A-Z]/.test(password)) return setError('Password must contain at least one uppercase letter.')
    if (password !== confirm) return setError('Passwords do not match.')

    setLoading(true)
    try {
      await resetPassword(code, password)
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.message ?? 'Reset failed. The link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div style={styles.page}>
        <div className="card" style={styles.card}>
          <h1 style={styles.heading}>Password reset!</h1>
          <p style={styles.text}>
            Your password has been updated. You can now log in with your new password.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/login')}>
            Go to login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <div className="card" style={styles.card}>
        <Link to="/login" style={styles.backLink}>← Back to login</Link>
        <h1 style={styles.heading}>Reset password</h1>
        <p style={styles.text}>Enter your new password below.</p>

        <ErrorMessage message={error} />

        <form onSubmit={handleSubmit} style={styles.form}>
          <div className="form-group">
            <label htmlFor="password">New password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="At least 8 characters, one number, one uppercase"
              autoComplete="new-password"
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirm">Confirm new password</label>
            <input
              id="confirm"
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              placeholder="Repeat your new password"
              autoComplete="new-password"
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={loading}
          >
            {loading ? 'Resetting…' : 'Reset password'}
          </button>
        </form>
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
}