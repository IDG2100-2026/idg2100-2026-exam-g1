import { Link, useNavigate } from 'react-router-dom'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div style={styles.page}>
      <div style={styles.content}>
        <p style={styles.code}>404</p>
        <h1 style={styles.title}>Page not found</h1>
        <p style={styles.sub}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div style={styles.actions}>
          <button className="btn btn-primary" onClick={() => navigate(-1)}>
            Go back
          </button>
          <Link to="/" className="btn btn-secondary">
            Home
          </Link>
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    padding: '2rem',
    textAlign: 'center',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem',
  },
  code: {
    fontSize: '6rem',
    fontWeight: 800,
    color: 'var(--accent)',
    lineHeight: 1,
    margin: 0,
  },
  title: {
    fontSize: '1.75rem',
    margin: 0,
  },
  sub: {
    color: 'var(--text-muted)',
    fontSize: '1rem',
    margin: 0,
  },
  actions: {
    display: 'flex',
    gap: '0.75rem',
    marginTop: '0.5rem',
  },
}
