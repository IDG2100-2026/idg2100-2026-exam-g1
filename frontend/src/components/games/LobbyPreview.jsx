import { Link } from 'react-router-dom'
import GameCard from './GameCard'

// Shows a limited preview of open lobby games on the homepage. (Does not work because of queue logic)
// The number of games shown is controlled by the `limit` prop (set via appearance settings).
export default function LobbyPreview({ games = [], limit = 5 }) {
  // Only show up to `limit` games
  const visible = games.slice(0, limit)

  return (
    <section style={styles.section}>
      <div style={styles.heading}>
        <h2 style={styles.title}>Open Lobby</h2>
        <Link to="/lobby" style={styles.viewAll}>View all →</Link>
      </div>

      {visible.length === 0 ? (
        <p style={styles.empty}>No games available to join right now.</p>
      ) : (
        <div style={styles.grid}>
          {/* autoJoin tells GameCard to join the game automatically on click */}
          {visible.map(game => (
            <GameCard key={game._id} game={game} autoJoin />
          ))}
        </div>
      )}
    </section>
  )
}

const styles = {
  section: { marginBottom: '2.5rem' },
  heading: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: '1rem',
  },
  title: { fontSize: '1.25rem' },
  viewAll: { fontSize: '0.875rem', color: 'var(--accent)' },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '1rem',
  },
  empty: { color: 'var(--text-muted)', fontSize: '0.9rem' },
}