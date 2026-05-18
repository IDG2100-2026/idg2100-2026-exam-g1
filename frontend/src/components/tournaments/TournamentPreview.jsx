// Sources:
// - Array.prototype.slice: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice
// - CSS Grid layout: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout

import TournamentCard from './TournamentCard'

// Shows a preview of up to 5 upcoming tournaments on the homepage.
export default function TournamentPreview({ tournaments = [] }) {
  // Only show the first 5 tournaments
  const visible = tournaments.slice(0, 5)

  return (
    <section style={styles.section}>
      <div style={styles.heading}>
        <h2 style={styles.title}>Upcoming Tournaments</h2>
      </div>

      {visible.length === 0 ? (
        <p style={styles.empty}>No upcoming tournaments at the moment.</p>
      ) : (
        <div style={styles.grid}>
          {visible.map(t => (
            <TournamentCard key={t._id} tournament={t} />
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
    marginBottom: '1rem',
  },
  title: { fontSize: '1.25rem' },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '1rem',
  },
  empty: { color: 'var(--text-muted)', fontSize: '0.9rem' },
}
