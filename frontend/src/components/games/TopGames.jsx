// Sources:
// - Array.prototype.some: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/some
// - CSS Grid layout: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout

import GameCard from './GameCard'

// Shows up to 5 games sorted by highest average ELO.
// If no live games exist, falls back to the most recent completed games.
export default function TopGames({ games = [] }) {
  // Check if any of the games are currently live to show the correct subtitle
  const hasLive = games.some(g => g.status === 'in_progress')

  return (
    <section style={styles.section}>
      <div style={styles.heading}>
        <h2 style={styles.title}>Top 5 Games</h2>
        {/* Subtitle changes depending on whether live games are available */}
        <span style={styles.sub}>
          {hasLive ? 'Currently running · highest ELO' : 'Most recent past games'}
        </span>
      </div>

      {games.length === 0 ? (
        <p style={styles.empty}>No games to show yet.</p>
      ) : (
        <div style={styles.grid}>
          {games.map(game => (
            <GameCard key={game._id} game={game} />
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
  sub: { fontSize: '0.8rem', color: 'var(--text-muted)' },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '1rem',
  },
  empty: { color: 'var(--text-muted)', fontSize: '0.9rem' },
}
