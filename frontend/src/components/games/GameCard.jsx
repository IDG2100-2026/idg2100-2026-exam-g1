// Sources:
// - React Router useNavigate: https://reactrouter.com/en/main/hooks/use-navigate
// - ARIA role="button": https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/button_role
// - Keyboard accessibility (onKeyDown): https://developer.mozilla.org/en-US/docs/Web/API/Element/keydown_event

import { useNavigate } from 'react-router-dom'

// Formats the game variant into a readable string, e.g. "Best of 3 · Straights · 10s"
function formatVariant(category) {
  if (!category) return 'Unknown variant'
  const straights = category.straightsAllowed ? 'Straights' : 'No straights'
  return `Best of ${category.rounds} · ${straights} · ${category.timePerRound}s`
}

// Calculates the average ELO of all registered players in the game.
function averageElo(players) {
  if (!players || players.length === 0) return null
  const elos = players.map(p => p.user?.elo).filter(e => typeof e === 'number')
  if (elos.length === 0) return null
  return Math.round(elos.reduce((a, b) => a + b, 0) / elos.length)
}

// Clickable card showing a game's variant, players, and average ELO.
// When autoJoin is true, navigating to the game page will automatically join it.
export default function GameCard({ game, autoJoin = false }) {
  const navigate = useNavigate()

  // Navigate to the game page, passing autoJoin so the game page knows to join on load.
  function handleClick() {
    navigate(`/games/${game._id}`, { state: { autoJoin } })
  }

  const avg = averageElo(game.players)

  // role="button" + tabIndex make the div keyboard-navigable like a real button
  // Source: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/button_role
  return (
    <div className="card" style={styles.card} onClick={handleClick} role="button" tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && handleClick()}
    >
      <p style={styles.variant}>{formatVariant(game.category)}</p>

      {/* List all player names in the game */}
      <div style={styles.players}>
        {game.players?.map((p, i) => (
          <span key={i} style={styles.player}>
            {p.displayName || p.user?.username || 'Guest'}
          </span>
        ))}
      </div>

      {/* Only show average ELO if at least one registered player exists */}
      {avg !== null && (
        <p style={styles.elo}>Avg ELO: <strong>{avg}</strong></p>
      )}

      {/* Badge shown only for games currently in progress */}
      {game.status === 'in_progress' && (
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
