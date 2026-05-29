import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listUsers } from '../../api/users'
import { banUser, unbanUser, setUserRole } from '../../api/admin'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ErrorMessage from '../../components/ui/ErrorMessage'

export default function AdminUsersPage() {
  const [users, setUsers]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  const [search, setSearch]     = useState('')
  const [roleFilter, setRoleFilter]   = useState('')
  const [bannedFilter, setBannedFilter] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const [actionError, setActionError] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    setLoading(true)
    const params = {}
    if (debouncedSearch.length >= 2) params.search = debouncedSearch
    if (roleFilter)   params.role     = roleFilter
    if (bannedFilter) params.isBanned = bannedFilter
    listUsers(params)
      .then(res => setUsers(res.results ?? []))
      .catch(() => setError('Failed to load users.'))
      .finally(() => setLoading(false))
  }, [debouncedSearch, roleFilter, bannedFilter])

  async function handleBan(user) {
    setActionError('')
    try {
      const updated = user.isBanned ? await unbanUser(user._id) : await banUser(user._id)
      setUsers(prev => prev.map(u => u._id === updated._id ? updated : u))
    } catch {
      setActionError('Failed to update ban status.')
    }
  }

  async function handleRole(user) {
    setActionError('')
    const newRole = user.role === 'admin' ? 'user' : 'admin'
    try {
      const updated = await setUserRole(user._id, newRole)
      setUsers(prev => prev.map(u => u._id === updated._id ? updated : u))
    } catch {
      setActionError('Failed to update role.')
    }
  }

  return (
    <div>
      <h1 style={styles.pageTitle}>User Administration</h1>

      {/* Filters */}
      <div style={styles.controls}>
        <input
          type="search"
          placeholder="Search by username…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={styles.searchInput}
        />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={styles.select}>
          <option value="">All roles</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        <select value={bannedFilter} onChange={e => setBannedFilter(e.target.value)} style={styles.select}>
          <option value="">All statuses</option>
          <option value="false">Active</option>
          <option value="true">Banned</option>
        </select>
      </div>

      {actionError && <ErrorMessage message={actionError} />}
      {loading && <LoadingSpinner message="Loading users..." />}
      {!loading && <ErrorMessage message={error} />}

      {!loading && !error && (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Username</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Role</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>ELO</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr><td colSpan={6} style={{ ...styles.td, color: 'var(--text-muted)', textAlign: 'center' }}>No users found.</td></tr>
              )}
              {users.map((user, i) => (
                <tr key={user._id} style={i % 2 === 0 ? styles.rowEven : {}}>
                  <td style={styles.td}>
                    <Link to={`/profile/${user._id}`} style={styles.userLink}>
                      {user.username}
                    </Link>
                  </td>
                  <td style={styles.td}>{user.email ?? '—'}</td>
                  <td style={styles.td}>
                    <span style={{ ...styles.badge, background: user.role === 'admin' ? '#1565c0' : 'var(--bg-surface-alt)' }}>
                      {user.role ?? 'user'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={{ ...styles.badge, background: user.isBanned ? '#b71c1c' : '#2e7d32' }}>
                      {user.isBanned ? 'Banned' : 'Active'}
                    </span>
                  </td>
                  <td style={styles.td}>{user.elo?.medium ?? '—'}</td>
                  <td style={styles.td}>
                    <div style={styles.actions}>
                      <button
                        className="btn btn-secondary"
                        style={styles.actionBtn}
                        onClick={() => handleBan(user)}
                      >
                        {user.isBanned ? 'Unban' : 'Ban'}
                      </button>
                      <button
                        className="btn btn-secondary"
                        style={styles.actionBtn}
                        onClick={() => handleRole(user)}
                      >
                        {user.role === 'admin' ? 'Remove admin' : 'Make admin'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const styles = {
  pageTitle: { marginBottom: '1.5rem' },
  controls: { display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' },
  searchInput: { flex: 1, minWidth: 200 },
  select: { padding: '0.4rem 0.6rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text)', cursor: 'pointer' },

  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' },
  th: {
    textAlign: 'left', padding: '0.6rem 0.75rem',
    background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)',
    fontWeight: 600, fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase',
  },
  td: { padding: '0.6rem 0.75rem', borderBottom: '1px solid var(--border)', verticalAlign: 'middle' },
  rowEven: { background: 'var(--bg-surface)' },
  userLink: { fontWeight: 600, color: 'var(--text)', textDecoration: 'none' },
  badge: {
    display: 'inline-block', padding: '0.15rem 0.55rem',
    borderRadius: '20px', fontSize: '0.72rem', color: '#fff', fontWeight: 600,
  },
  actions: { display: 'flex', gap: '0.4rem' },
  actionBtn: { fontSize: '0.78rem', padding: '0.25rem 0.6rem' },
}
