import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getProfile } from '../api/users'
import { listGames } from '../api/games'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ErrorMessage from '../components/ui/ErrorMessage'

function formatVariant(game) {
  if (!game) return '—'
  const straights = game.variant === 'straights' ? 'Straights' : 'No straights'
  return `Best of ${game.rounds} · ${straights} · ${game.timeControl}s`
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

// Full game history for a user — paginated list with Win/Loss result, variant, players, and date.
export default function UserGamesPage() {
  const { id } = useParams()
  const [username, setUsername] = useState('')
  const [games, setGames]       = useState([])
  const [pagination, setPagination] = useState(null)
  const [page, setPage]         = useState(1)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

  // Fetch the username separately so the page heading shows a name, not just an ID
  useEffect(() => {
    getProfile(id).then(res => setUsername(res.username)).catch(() => {})
  }, [id])

  useEffect(() => {
    async function fetch() {
      setLoading(true)
      setError('')
      try {
        const res = await listGames({ userId: id, page, limit: 20 })
        setGames(res.results ?? [])
        setPagination(res)
      } catch {
        setError('Failed to load games.')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [id, page])

  return (
    <div className="container">
      <div style={styles.heading}>
        <div>
          <Link to={`/profile/${id}`} style={styles.back}>← Back to profile</Link>
          <h1 style={styles.title}>{username ? `${username}'s Games` : 'All Games'}</h1>
          {pagination && <p style={styles.sub}>{pagination.total} games total</p>}
        </div>
      </div>

      {loading && <LoadingSpinner message="Loading games..." />}
      <ErrorMessage message={error} />

      {!loading && !error && games.length === 0 && (
        <p style={styles.empty}>No games found.</p>
      )}

      {!loading && games.length > 0 && (
        <>
          <div style={styles.list}>
            {games.map(g => {
              const won = g.winner?._id?.toString() === id || g.winner?.toString() === id
              return (
                <Link key={g._id} to={`/games/${g._id}`} style={styles.row}>
                  <span style={{ ...styles.result, color: g.status === 'completed' ? (won ? 'var(--success)' : 'var(--error)') : 'var(--text-muted)' }}>
                    {g.status === 'completed' ? (won ? 'Win' : 'Loss') : g.status}
                  </span>
                  <span style={styles.variant}>{formatVariant(g)}</span>
                  <span style={styles.players}>
                    {g.players?.map(p => p.user?.username || 'Guest').join(' vs ')}
                  </span>
                  <span style={styles.date}>{formatDate(g.createdAt)}</span>
                </Link>
              )
            })}
          </div>

          {pagination && pagination.pages > 1 && (
            <div style={styles.pager}>
              <button className="btn btn-secondary" onClick={() => setPage(p => p - 1)} disabled={page === 1}>
                ← Previous
              </button>
              <span style={styles.pageInfo}>Page {page} of {pagination.pages}</span>
              <button className="btn btn-secondary" onClick={() => setPage(p => p + 1)} disabled={page === pagination.pages}>
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

const styles = {
  heading: { marginBottom: '2rem' },
  back: { fontSize: '0.85rem', color: 'var(--text-muted)', textDecoration: 'none', display: 'block', marginBottom: '0.5rem' },
  title: { marginBottom: '0.25rem' },
  sub: { color: 'var(--text-muted)', fontSize: '0.9rem' },
  list: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  row: {
    display: 'grid',
    gridTemplateColumns: '60px 1fr 1fr auto',
    gap: '0.75rem',
    alignItems: 'center',
    padding: '0.7rem 1rem',
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    textDecoration: 'none',
    color: 'var(--text)',
    fontSize: '0.875rem',
  },
  result: { fontWeight: 700, fontSize: '0.85rem' },
  variant: { color: 'var(--text-muted)', fontSize: '0.8rem' },
  players: { fontWeight: 500 },
  date: { color: 'var(--text-muted)', fontSize: '0.78rem', whiteSpace: 'nowrap' },
  empty: { color: 'var(--text-muted)' },
  pager: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginTop: '2rem' },
  pageInfo: { fontSize: '0.875rem', color: 'var(--text-muted)' },
}
