import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppearance } from '../context/AppearanceContext'
import { listGames } from '../api/games'
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

// Homepage — fetches waiting games, top-rated live/completed games, and upcoming tournaments in parallel.
export default function HomePage() {
  const { lobbyCount } = useAppearance()

  const [lobbyGames, setLobbyGames] = useState([])
  const [topGames, setTopGames] = useState([])
  const [tournaments, setTournaments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchAll() {
      setLoading(true)
      setError('')
      try {
        // Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all
        const [lobbyRes, liveRes, completedRes, tourRes] = await Promise.all([
          listGames({ status: 'waiting', limit: 20 }),
          listGames({ status: 'in_progress', limit: 20 }),
          listGames({ status: 'completed', limit: 10, sort: '-createdAt' }),
          listTournaments({ status: 'upcoming', limit: 5, sort: 'startDate' }),
        ])

        setLobbyGames(lobbyRes.results ?? [])

        // Top 5: live games sorted by avg ELO, fill with recent completed if needed
        const live = (liveRes.results ?? [])
          .sort((a, b) => averageElo(b.players) - averageElo(a.players))
        const combined = live.length >= 5
          ? live.slice(0, 5)
          : [...live, ...(completedRes.results ?? [])].slice(0, 5)
        setTopGames(combined)

        setTournaments(tourRes.results ?? [])
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

      {loading && <LoadingSpinner message="Loading platform activity..." />}
      <ErrorMessage message={error} />

      {!loading && !error && (
        <>
          <LobbyPreview games={lobbyGames} limit={lobbyCount} />
          <TopGames games={topGames} />
          <TournamentPreview tournaments={tournaments} />
        </>
      )}
    </div>
  )
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
