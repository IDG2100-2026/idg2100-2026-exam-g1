import { Outlet, NavLink, Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function AdminLayout() {
  const { currentUser, isLoggedIn } = useAuth()

  if (!isLoggedIn) return <Navigate to="/login" replace />
  if (currentUser?.role !== 'admin') return <Navigate to="/" replace />

  return (
    <div style={styles.wrapper}>
      <header style={styles.header}>
        <NavLink to="/" style={styles.logo}>Spanish Poker Dice</NavLink>
        <nav style={styles.nav}>
          <NavLink to="/admin"                     end style={navStyle}>Dashboard</NavLink>
          <NavLink to="/admin/users"               style={navStyle}>Users</NavLink>
          <NavLink to="/admin/comments"            style={navStyle}>Comments</NavLink>
          <NavLink to="/admin/tournaments/create"  style={navStyle}>Create Tournament</NavLink>
        </nav>
      </header>
      <main style={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}

function navStyle({ isActive }) {
  return {
    fontSize: '0.875rem',
    fontWeight: isActive ? 700 : 400,
    color: isActive ? 'var(--accent)' : 'var(--text-muted)',
    textDecoration: 'none',
    padding: '0.25rem 0',
    borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
    transition: 'color 0.15s',
  }
}

const styles = {
  wrapper: { minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '2rem',
    padding: '0 2rem',
    height: 56,
    borderBottom: '1px solid var(--border)',
    background: 'var(--bg-surface)',
    flexWrap: 'wrap',
  },
  logo: {
    fontWeight: 700,
    fontSize: '1rem',
    color: 'var(--text)',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  },
  nav: { display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' },
  main: { flex: 1, padding: '2rem', maxWidth: 1100, margin: '0 auto', width: '100%', boxSizing: 'border-box' },
}