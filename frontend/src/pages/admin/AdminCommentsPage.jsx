import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAdminComments, deleteComment } from '../../api/admin'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ErrorMessage from '../../components/ui/ErrorMessage'

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function AdminCommentsPage() {
  const [comments, setComments] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    getAdminComments()
      .then(setComments)
      .catch(() => setError('Failed to load comments.'))
      .finally(() => setLoading(false))
  }, [])

  async function handleDelete(id) {
    if (!window.confirm('Delete this comment?')) return
    setActionError('')
    try {
      await deleteComment(id)
      setComments(prev => prev.filter(c => c._id !== id))
    } catch {
      setActionError('Failed to delete comment.')
    }
  }

  return (
    <div>
      <h1 style={styles.pageTitle}>Comment Administration</h1>
      <p style={styles.sub}>Showing the most recent 50 comments across the platform.</p>

      {actionError && <ErrorMessage message={actionError} />}
      {loading && <LoadingSpinner message="Loading comments..." />}
      {!loading && <ErrorMessage message={error} />}

      {!loading && !error && comments.length === 0 && (
        <p style={styles.empty}>No comments found.</p>
      )}

      {!loading && !error && comments.length > 0 && (
        <div style={styles.list}>
          {comments.map((c, i) => (
            <div key={c._id} style={{ ...styles.row, ...(i % 2 === 0 ? styles.rowEven : {}) }}>
              <div style={styles.meta}>
                <span style={styles.author}>{c.author?.username ?? 'Unknown'}</span>
                <span style={styles.target}>
                  on {c.targetType}{' '}
                  <Link to={`/${c.targetType === 'match' ? 'games' : 'tournaments'}/${c.targetId}`} style={styles.link}>
                    {String(c.targetId).slice(-6)}
                  </Link>
                </span>
                <span style={styles.date}>{formatDate(c.createdAt)}</span>
              </div>
              <p style={styles.content}>{c.content}</p>
              <button
                className="btn"
                style={styles.deleteBtn}
                onClick={() => handleDelete(c._id)}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const styles = {
  pageTitle: { marginBottom: '0.5rem' },
  sub: { color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' },
  empty: { color: 'var(--text-muted)' },

  list: { display: 'flex', flexDirection: 'column', gap: 0 },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gridTemplateRows: 'auto auto',
    gap: '0.25rem 1rem',
    padding: '0.75rem',
    borderBottom: '1px solid var(--border)',
    alignItems: 'start',
  },
  rowEven: { background: 'var(--bg-surface)' },
  meta: { display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', gridColumn: 1, gridRow: 1 },
  author: { fontWeight: 700, fontSize: '0.875rem' },
  target: { fontSize: '0.78rem', color: 'var(--text-muted)' },
  link: { color: 'var(--accent)', textDecoration: 'none' },
  date: { fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto' },
  content: { fontSize: '0.875rem', color: 'var(--text)', lineHeight: 1.5, margin: 0, gridColumn: 1, gridRow: 2 },
  deleteBtn: {
    background: 'var(--error, #c0392b)', color: '#fff', border: 'none',
    fontSize: '0.78rem', padding: '0.25rem 0.6rem',
    gridColumn: 2, gridRow: '1 / 3', alignSelf: 'center',
  },
}