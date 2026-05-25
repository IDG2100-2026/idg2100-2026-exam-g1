// Sources:
// - React useState: https://react.dev/reference/react/useState
// - React useEffect: https://react.dev/reference/react/useEffect
// - CSS Grid layout: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout

import { useEffect, useState } from 'react'
import { listTournaments } from '../api/tournaments'
import TournamentCard from '../components/tournaments/TournamentCard'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ErrorMessage from '../components/ui/ErrorMessage'

// Full tournaments list — fetches up to 50 tournaments sorted by start date.
export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetch() {
      try {
        const res = await listTournaments({ sort: 'startDate', limit: 50 })
        setTournaments(res.data ?? [])
      } catch {
        setError('Failed to load tournaments.')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  return (
    <div className="container">
      <div style={styles.heading}>
        <h1>Tournaments</h1>
        <p style={styles.sub}>Upcoming and recent tournaments</p>
      </div>

      {loading && <LoadingSpinner message="Loading tournaments..." />}
      <ErrorMessage message={error} />

      {!loading && !error && tournaments.length === 0 && (
        <p style={styles.empty}>No tournaments available at the moment.</p>
      )}

      {!loading && tournaments.length > 0 && (
        <div style={styles.grid}>
          {tournaments.map(t => (
            <TournamentCard key={t._id} tournament={t} />
          ))}
        </div>
      )}
    </div>
  )
}

const styles = {
  heading: { marginBottom: '2rem' },
  sub: { color: 'var(--text-muted)', marginTop: '0.25rem' },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '1rem',
  },
  empty: { color: 'var(--text-muted)' },
}
