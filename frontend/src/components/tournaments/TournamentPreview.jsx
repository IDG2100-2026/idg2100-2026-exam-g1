import { Link } from 'react-router-dom'
import TournamentCard from './TournamentCard'

// Shows a preview of up to 5 upcoming tournaments on the homepage.
export default function TournamentPreview({ tournaments = [] }) {
  const visible = tournaments.slice(0, 5)

  return (
    <section style={styles.section}>
      <div style={styles.heading}>
        <h2 style={styles.title}>Upcoming Tournaments</h2>
        <Link to="/tournaments" style={styles.viewAll}>View all tournaments →</Link>
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