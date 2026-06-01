import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { listGames } from '../api/games'
import GameCard from '../components/games/GameCard'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ErrorMessage from '../components/ui/ErrorMessage'

const ELO_RANGE = 300

function avgElo(players) {
  const elos = players?.map(p => p.user?.elo?.medium).filter(e => typeof e === 'number') ?? []
  if (elos.length === 0) return null
  return elos.reduce((a, b) => a + b, 0) / elos.length
}

const FILTERS = {
  variant:     { label: 'Variant',      options: [{ value: '', label: 'All' }, { value: 'standard', label: 'Standard' }, { value: 'straights', label: 'Straights' }] },
  rounds:      { label: 'Rounds',       options: [{ value: '', label: 'All' }, { value: '3', label: '3' }, { value: '5', label: '5' }, { value: '7', label: '7' }] },
  timeControl: { label: 'Time control', options: [{ value: '', label: 'All' }, { value: '10', label: '10s' }, { value: '30', label: '30s' }, { value: '90', label: '90s' }] },
}

export default function LobbyPage() {
  const { isLoggedIn, currentUser } = useAuth()

  const [games, setGames]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState('')
  const [visible, setVisible] = useState(12)

  const [filters, setFilters] = useState({ variant: '', rounds: '', timeControl: '' })

  async function fetchGames(activeFilters) {
    try {
      const params = { status: 'waiting', limit: 50 }
      if (activeFilters.variant)     params.variant     = activeFilters.variant
      if (activeFilters.rounds)      params.rounds      = activeFilters.rounds
      if (activeFilters.timeControl) params.timeControl = activeFilters.timeControl

      const res = await listGames(params)
      const all = res.results ?? []

      const filtered = all.filter(g => {
        if (!isLoggedIn || !currentUser?.elo?.medium) return true
        const gameAvg = avgElo(g.players)
        return gameAvg === null || Math.abs(gameAvg - currentUser.elo.medium) <= ELO_RANGE
      })

      setGames(filtered)
      setError('')
    } catch {
      setError('Failed to load lobby. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    fetchGames(filters)
    const interval = setInterval(() => fetchGames(filters), 15000)
    return () => clearInterval(interval)
  }, [filters, isLoggedIn, currentUser?.elo?.medium])

  function setFilter(key, value) {
    setFilters(prev => ({ ...prev, [key]: value }))
    setVisible(12)
  }

  function clearFilters() {
    setFilters({ variant: '', rounds: '', timeControl: '' })
    setVisible(12)
  }

  const hasActiveFilters = Object.values(filters).some(v => v !== '')

  return (
    <div className="container">
      <div style={styles.heading}>
        <div>
          <h1 style={styles.title}>Lobby</h1>
          <p style={styles.sub}>Games waiting for players to join</p>
        </div>
        <Link to="/create-game" className="btn btn-primary">Create a Game</Link>
      </div>

      <div style={styles.filterBar}>
        {Object.entries(FILTERS).map(([key, { label, options }]) => (
          <div key={key} style={styles.filterGroup}>
            <span style={styles.filterLabel}>{label}</span>
            <div style={styles.pills}>
              {options.map(opt => (
                <button
                  key={opt.value}
                  style={{
                    ...styles.pill,
                    ...(filters[key] === opt.value ? styles.pillActive : {}),
                  }}
                  onClick={() => setFilter(key, opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        ))}

        {hasActiveFilters && (
          <button style={styles.clearBtn} onClick={clearFilters}>
            Clear filters
          </button>
        )}
      </div>

      {loading && <LoadingSpinner message="Loading lobby..." />}
      <ErrorMessage message={error} />

      {!loading && !error && games.length === 0 && (
        <div style={styles.empty}>
          <p>{hasActiveFilters ? 'No games match your filters.' : 'No games available right now.'}</p>
          <p style={styles.emptySub}>
            {hasActiveFilters
              ? <button style={styles.clearBtn} onClick={clearFilters}>Clear filters</button>
              : 'Be the first — create a new game!'}
          </p>
        </div>
      )}

      {!loading && games.length > 0 && (
        <>
          <div style={styles.grid}>
            {games.slice(0, visible).map(game => (
              <GameCard key={game._id} game={game} autoJoin />
            ))}
          </div>
          {visible < games.length && (
            <div style={styles.loadMore}>
              <button
                className="btn btn-secondary"
                onClick={() => setVisible(v => v + 12)}
              >
                Load more
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

const styles = {
  heading: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  title: { marginBottom: '0.25rem' },
  sub: { color: 'var(--text-muted)', fontSize: '0.95rem' },

  filterBar: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '1rem',
    padding: '0.75rem 1rem',
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    marginBottom: '1.5rem',
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    flexWrap: 'wrap',
  },
  filterLabel: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  pills: { display: 'flex', gap: '0.3rem' },
  pill: {
    padding: '0.25rem 0.65rem',
    fontSize: '0.8rem',
    border: '1px solid var(--border)',
    borderRadius: '20px',
    background: 'transparent',
    color: 'var(--text)',
    cursor: 'pointer',
    transition: 'background 0.15s, border-color 0.15s, color 0.15s',
  },
  pillActive: {
    background: 'var(--accent)',
    borderColor: 'var(--accent)',
    color: '#fff',
  },
  clearBtn: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textDecoration: 'underline',
    padding: 0,
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '1rem',
  },
  empty: {
    textAlign: 'center',
    padding: '3rem 0',
    color: 'var(--text-muted)',
  },
  emptySub: {
    fontSize: '0.875rem',
    marginTop: '0.5rem',
  },
  loadMore: { display: 'flex', justifyContent: 'center', marginTop: '1.5rem' },
}
