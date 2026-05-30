import { Link } from 'react-router-dom'

function formatVariant(tournament) {
  if (!tournament) return 'Unknown variant'
  const straights = tournament.variant === 'straights' ? 'Straights' : 'No straights'
  return `${tournament.totalRounds} rounds · ${straights} · ${tournament.timeControl}s`
}

function formatDate(dateStr) {
  if (!dateStr) return 'TBD'
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const STATUS_COLORS = {
  upcoming:  { bg: 'var(--accent-light)', color: 'var(--accent)' },
  ongoing:   { bg: '#d4edda', color: '#155724' },
  finished:  { bg: 'var(--bg-surface-alt)', color: 'var(--text-muted)' },
  cancelled: { bg: '#f8d7da', color: '#721c24' },
}

export default function TournamentCard({ tournament }) {
  const statusStyle = STATUS_COLORS[tournament.status] ?? STATUS_COLORS.finished

  return (
    <Link to={`/tournaments/${tournament._id}`} style={{ textDecoration: 'none' }}>
      <div className="card" style={styles.card}>
        <div style={styles.topRow}>
          <p style={styles.title}>{tournament.title}</p>
          <span style={{ ...styles.badge, ...statusStyle }}>
            {tournament.status ?? 'unknown'}
          </span>
        </div>
        <p style={styles.meta}>{formatDate(tournament.startDate)}</p>
        <p style={styles.meta}>{formatVariant(tournament)}</p>
        {tournament.createdBy?.username && (
          <p style={styles.author}>by {tournament.createdBy.username}</p>
        )}
        <p style={styles.players}>
          {tournament.players?.length ?? 0} / {tournament.maxPlayers ?? '?'} players signed up
        </p>
      </div>
    </Link>
  )
}

const styles = {
  card: { display: 'flex', flexDirection: 'column', gap: '0.3rem' },
  topRow: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' },
  title: { fontWeight: 600, color: 'var(--text-heading)', fontSize: '0.95rem', margin: 0 },
  badge: {
    fontSize: '0.7rem', fontWeight: 600, padding: '0.15rem 0.5rem',
    borderRadius: '20px', whiteSpace: 'nowrap', textTransform: 'capitalize', flexShrink: 0,
  },
  meta: { fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 },
  author: { fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 },
  players: { fontSize: '0.8rem', color: 'var(--accent)', marginTop: '0.25rem', fontWeight: 500 },
}
