import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppearance } from '../context/AppearanceContext'
import { listGames, getPlatformStats } from '../api/games'
import { listTournaments } from '../api/tournaments'
import LobbyPreview from '../components/games/LobbyPreview'
import TopGames from '../components/games/TopGames'
import TournamentPreview from '../components/tournaments/TournamentPreview'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ErrorMessage from '../components/ui/ErrorMessage'

// Computes the average ELO of all players in a game, used to rank top games
function averageElo(players) {
  const elos = players?.map(p => p.user?.elo?.medium).filter(e => typeof e === 'number') ?? []
  if (elos.length === 0) return 0
  return elos.reduce((a, b) => a + b, 0) / elos.length
}

// Counts unique players across all in-progress games
function countActivePlayers(liveGames) {
  const ids = new Set()
  liveGames.forEach(g => g.players?.forEach(p => {
    const id = p.user?._id ?? p.user
    if (id) ids.add(String(id))
  }))
  return ids.size
}

function PlatformActivity({ stats }) {
  if (!stats) return null
  const items = [
    { label: 'Active players',  value: stats.activePlayers },
    { label: 'Available games', value: stats.availableGames },
    { label: 'Games this week', value: stats.gamesLastWeek ?? '—' },
  ]
  return (
    <section style={actStyles.section}>
      <h2 style={actStyles.title}>Platform Activity</h2>
      <div style={actStyles.grid}>
        {items.map(item => (
          <div key={item.label} style={actStyles.card}>
            <span style={actStyles.value}>{item.value}</span>
            <span style={actStyles.label}>{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

// Homepage — fetches waiting games, top-rated live/completed games, and upcoming tournaments in parallel.
export default function HomePage() {
  const { lobbyCount } = useAppearance()

  const [lobbyGames, setLobbyGames] = useState([])
  const [topGames, setTopGames] = useState([])
  const [tournaments, setTournaments] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchAll() {
      setLoading(true)
      setError('')
      try {
        const [lobbyRes, liveRes, completedRes, tourRes] = await Promise.all([
          listGames({ status: 'waiting', limit: 20 }),
          listGames({ status: 'in_progress', limit: 20 }),
          listGames({ status: 'completed', limit: 10, sort: '-createdAt' }),
          listTournaments({ status: 'upcoming', limit: 5, sort: 'startDate' }),
        ])

        const lobby = lobbyRes.results ?? []
        const live  = liveRes.results ?? []

        setLobbyGames(lobby)

        // Top 5: live games sorted by avg ELO, fill with recent completed if needed
        const sorted = [...live].sort((a, b) => averageElo(b.players) - averageElo(a.players))
        const combined = sorted.length >= 5
          ? sorted.slice(0, 5)
          : [...sorted, ...(completedRes.results ?? [])].slice(0, 5)
        setTopGames(combined)

        setTournaments(tourRes.results ?? [])

        // Derive available games + active players from already-fetched data.
        // Games last week comes from the /stats endpoint (falls back gracefully).
        const activePlayers  = countActivePlayers(live)
        const availableGames = lobby.length
        let gamesLastWeek = null
        try {
          const s = await getPlatformStats()
          gamesLastWeek = s.gamesLastWeek ?? s.gamesPlayed?.lastWeek ?? null
        } catch { /* /stats endpoint may not be available yet */ }

        setStats({ activePlayers, availableGames, gamesLastWeek })
      } catch {
        setError('Failed to load homepage data. Is the backend running?')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  return (
    <div className="container">

      {/* Hero */}
      <section style={styles.hero}>
        <div>
          <h1 style={styles.heroTitle}>Spanish Poker Dice</h1>
          <p style={styles.heroSub}>
            Fight players in the classic Spanish dice game. Roll
            and outplay your opponents.
          </p>
        </div>
        <Link to="/create-game" className="btn btn-primary" style={styles.heroBtn}>
          Create a Game
        </Link>
      </section>

      {loading && <LoadingSpinner message="Loading..." />}
      <ErrorMessage message={error} />

      {!loading && !error && (
        <>
          <PlatformActivity stats={stats} />
          <LobbyPreview games={lobbyGames} limit={lobbyCount} />
          <TopGames games={topGames} />
          <TournamentPreview tournaments={tournaments} />
        </>
      )}
    </div>
  )
}

const actStyles = {
  section: { marginBottom: '2.5rem' },
  title: { fontSize: '1.25rem', marginBottom: '1rem' },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: '1rem',
  },
  card: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  value: { fontSize: '2rem', fontWeight: 700, color: 'var(--accent)' },
  label: { fontSize: '0.8rem', color: 'var(--text-muted)' },
}

const styles = {
  hero: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '1.5rem',
    padding: '2.5rem 0 2rem',
    borderBottom: '1px solid var(--border)',
    marginBottom: '2rem',
  },
  heroTitle: {
    fontSize: '2.25rem',
    marginBottom: '0.5rem',
  },
  heroSub: {
    color: 'var(--text-muted)',
    maxWidth: 520,
    lineHeight: 1.6,
  },
  heroBtn: {
    fontSize: '1rem',
    padding: '0.75rem 1.75rem',
    flexShrink: 0,
  },
}