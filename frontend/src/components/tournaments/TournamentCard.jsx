// Sources:
// - React Router Link: https://reactrouter.com/en/main/components/link
// - Date.toLocaleDateString: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleDateString
// - Optional chaining (?.): https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining
// - Nullish coalescing (??): https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing

import { Link } from 'react-router-dom'

// Formats the game variant into a readable string, e.g. "Best of 5 · Straights · 10s"
function formatVariant(category) {
  if (!category) return 'Unknown variant'
  const straights = category.straightsAllowed ? 'Straights' : 'No straights'
  return `Best of ${category.rounds} · ${straights} · ${category.timePerRound}s`
}

// Formats an ISO date string into a short human-readable date and time
function formatDate(dateStr) {
  if (!dateStr) return 'TBD'
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// Card showing a tournament's title, date, variant, and number of signed-up players.
export default function TournamentCard({ tournament }) {
  return (
    <Link to={`/tournaments/${tournament._id}`} style={{ textDecoration: 'none' }}>
      <div className="card" style={styles.card}>
        <p style={styles.title}>{tournament.title}</p>
        <p style={styles.meta}>{formatDate(tournament.startDate)}</p>
        <p style={styles.meta}>{formatVariant(tournament.category)}</p>
        {/* Show how many players have signed up for this tournament */}
        <p style={styles.players}>
          {tournament.participants?.length ?? 0} player{tournament.participants?.length !== 1 ? 's' : ''} signed up
        </p>
      </div>
    </Link>
  )
}

const styles = {
  card: { display: 'flex', flexDirection: 'column', gap: '0.3rem' },
  title: { fontWeight: 600, color: 'var(--text-heading)', fontSize: '0.95rem' },
  meta: { fontSize: '0.8rem', color: 'var(--text-muted)' },
  players: { fontSize: '0.8rem', color: 'var(--accent)', marginTop: '0.25rem', fontWeight: 500 },
}