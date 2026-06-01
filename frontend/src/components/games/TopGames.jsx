import GameCard from './GameCard'

export default function TopGames({ games = [] }) {
  const hasLive = games.some(g => g.status === 'ongoing')

  return (
    <section style={styles.section}>
      <div style={styles.heading}>
        <h2 style={styles.title}>Top 5 Games</h2>
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
