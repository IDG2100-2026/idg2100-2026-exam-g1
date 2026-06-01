import { Link } from 'react-router-dom'
import GameCard from './GameCard'

export default function LobbyPreview({ games = [], limit = 5 }) {
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