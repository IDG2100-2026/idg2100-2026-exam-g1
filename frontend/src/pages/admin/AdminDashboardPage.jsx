import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDashboard } from '../../api/admin'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ErrorMessage from '../../components/ui/ErrorMessage'

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function StatCard({ label, value, sub }) {
  return (
    <div style={styles.statCard}>
      <span style={styles.statValue}>{value ?? '—'}</span>
      <span style={styles.statLabel}>{label}</span>
      {sub && <span style={styles.statSub}>{sub}</span>}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section style={styles.section}>
      <h2 style={styles.sectionTitle}>{title}</h2>
      {children}
    </section>
  )
}

export default function AdminDashboardPage() {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState('')

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch(() => setError('Failed to load dashboard.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner message="Loading dashboard..." />
  if (error)   return <ErrorMessage message={error} />
  if (!data)   return null

  const { newProfiles, activePlayers, gamesPlayed, availableGames, incidents } = data

  return (
    <div>
      <h1 style={styles.pageTitle}>Admin Dashboard</h1>

      <div style={styles.quickLinks}>
        <Link to="/admin/users"              className="btn btn-secondary">User Administration</Link>
        <Link to="/admin/comments"           className="btn btn-secondary">Comment Administration</Link>
        <Link to="/admin/tournaments/create" className="btn btn-secondary">Create Tournament</Link>
      </div>

      <Section title="Platform Activity">
        <div style={styles.statsGrid}>
          <StatCard label="Active players"  value={activePlayers} />
          <StatCard label="Available games" value={availableGames} />
          <StatCard label="Games this week" value={gamesPlayed?.lastWeek} />
        </div>
      </Section>

      <Section title="New Profiles">
        <div style={styles.statsGrid}>
          <StatCard label="New profiles this week" value={newProfiles?.lastWeek} />
        </div>
      </Section>

      <Section title="Security Incidents">
        {!incidents?.length ? (
          <p style={styles.empty}>No incidents recorded.</p>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>IP</th>
                  <th style={styles.th}>User agent</th>
                  <th style={styles.th}>Time</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((inc, i) => (
                  <tr key={inc._id ?? i} style={i % 2 === 0 ? styles.rowEven : {}}>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, background: inc.type === 'rate_limit' ? '#7b1fa2' : '#b71c1c' }}>
                        {inc.type ?? 'unknown'}
                      </span>
                    </td>
                    <td style={styles.td}>{inc.ip ?? '—'}</td>
                    <td style={{ ...styles.td, ...styles.uaCell }}>{inc.userAgent ?? '—'}</td>
                    <td style={styles.td}>{formatDate(inc.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  )
}

const styles = {
  pageTitle: { marginBottom: '1.5rem' },
  quickLinks: { display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2rem' },

  section: { marginBottom: '2.5rem' },
  sectionTitle: { fontSize: '1.1rem', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' },

  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' },
  statCard: {
    background: 'var(--bg-surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', padding: '1rem',
    display: 'flex', flexDirection: 'column', gap: '0.2rem',
  },
  statValue: { fontSize: '1.75rem', fontWeight: 700, color: 'var(--accent)' },
  statLabel: { fontSize: '0.78rem', color: 'var(--text-muted)' },
  statSub:   { fontSize: '0.72rem', color: 'var(--text-muted)' },

  empty: { color: 'var(--text-muted)', fontSize: '0.875rem' },

  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' },
  th: {
    textAlign: 'left', padding: '0.5rem 0.75rem',
    background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)',
    fontWeight: 600, fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase',
  },
  td: { padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border)', verticalAlign: 'top' },
  rowEven: { background: 'var(--bg-surface)' },
  uaCell: { maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  badge: {
    display: 'inline-block', padding: '0.15rem 0.5rem',
    borderRadius: '20px', fontSize: '0.72rem', color: '#fff', fontWeight: 600,
  },
}
