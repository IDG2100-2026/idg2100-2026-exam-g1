import { useNavigate } from 'react-router-dom'

function formatVariant(game) {
  if (!game) return 'Unknown variant'
  const straights = game.variant === 'straights' ? 'Straights' : 'No straights'
  return `Best of ${game.rounds} · ${straights} · ${game.timeControl}s`
}

function averageElo(players) {
  if (!players || players.length === 0) return null
  const elos = players.map(p => p.user?.elo?.medium).filter(e => typeof e === 'number')
  if (elos.length === 0) return null
  return Math.round(elos.reduce((a, b) => a + b, 0) / elos.length)
}

export default function GameCard({ game, autoJoin = false }) {
  const navigate = useNavigate()

  function handleClick() {
    navigate(`/games/${game._id}`, { state: { autoJoin } })
  }

  const avg = averageElo(game.players)

  return (
    <div className="card" style={styles.card} onClick={handleClick} role="button" tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && handleClick()}
    >
      <p style={styles.variant}>{formatVariant(game)}</p>

      <div style={styles.players}>
        {game.players?.map((p, i) => (
          <span key={i} style={styles.player}>
            {p.user?.username || 'Guest'}
          </span>
        ))}
      </div>

      {avg !== null && (
        <p style={styles.elo}>Avg ELO: <strong>{avg}</strong></p>
      )}

      {game.status === 'ongoing' && (
        <span style={styles.badge}>Live</span>
      )}
    </div>
  )
}

const styles = {
  card: {
    cursor: 'pointer',
    transition: 'box-shadow 0.15s, transform 0.1s',
    userSelect: 'none',
  },
  variant: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    marginBottom: '0.5rem',
  },
  players: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
    marginBottom: '0.4rem',
  },
  player: {
    fontWeight: 600,
    fontSize: '0.95rem',
    color: 'var(--text-heading)',
  },
  elo: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    marginTop: '0.25rem',
  },
  badge: {
    display: 'inline-block',
    marginTop: '0.5rem',
    padding: '0.2rem 0.5rem',
    background: 'var(--success-light)',
    color: 'var(--success)',
    borderRadius: 'var(--radius)',
    fontSize: '0.75rem',
    fontWeight: 600,
  },
}
