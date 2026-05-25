// Sources:
// - React useEffect: https://react.dev/reference/react/useEffect
// - React Router useParams: https://reactrouter.com/en/main/hooks/use-params
// - React Router Link: https://reactrouter.com/en/main/components/link

import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { verifyEmail } from '../api/users'
import LoadingSpinner from '../components/ui/LoadingSpinner'

// Handles the /verify/:code route from the email verification link.
// Calls the backend with the code and shows success or failure.
export default function VerifyEmailPage() {
  const { code } = useParams()
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    verifyEmail(code)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'))
  }, [code])

  return (
    <div style={styles.page}>
      <div className="card" style={styles.card}>
        <Link to="/" style={styles.backLink}>← Spanish Poker Dice</Link>

        {status === 'loading' && <LoadingSpinner message="Verifying your email..." />}

        {status === 'success' && (
          <>
            <h1 style={styles.heading}>Email verified!</h1>
            <p style={styles.sub}>Your account is now active. You can log in.</p>
            <Link to="/login" className="btn btn-primary" style={{ textAlign: 'center' }}>
              Log in
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <h1 style={styles.heading}>Verification failed</h1>
            <p style={styles.sub}>
              The link is invalid or has expired. Request a new one below.
            </p>
            <Link to="/resend-verification" className="btn btn-primary" style={{ textAlign: 'center' }}>
              Resend verification email
            </Link>
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
}
