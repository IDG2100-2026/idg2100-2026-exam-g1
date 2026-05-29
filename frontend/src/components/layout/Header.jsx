import { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useAppearance } from '../../context/AppearanceContext'
import { updateProfile } from '../../api/users'

// Small circular button used to pick a board background color in the appearance panel.
function ColorSwatch({ color, active, onClick }) {
  return (
    <button
      title={color.label}
      onClick={onClick}
      style={{
        width: 26, height: 26,
        borderRadius: '50%',
        background: color.value,
        // Highlighted border when this color is the currently selected one
        border: active ? '3px solid var(--accent)' : '2px solid var(--border)',
        cursor: 'pointer',
        flexShrink: 0,
      }}
    />
  )
}

export default function Header() {
  const { currentUser, isLoggedIn, logout } = useAuth()
  const {
    theme, setTheme,
    boardColor, setBoardColor,
    soundOn, setSoundOn,
    lobbyCount, setLobbyCount,
    BOARD_COLORS,
  } = useAppearance()

  // Controls whether the desktop appearance dropdown is open
  const [panelOpen, setPanelOpen] = useState(false)
  // Controls whether the mobile drawer is open
  const [menuOpen, setMenuOpen] = useState(false)

  // Ref on the appearance panel so we can detect clicks outside it
  const panelRef = useRef(null)
  const navigate = useNavigate()

  // Close the appearance panel when the user clicks anywhere outside it
  // Source: https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
  useEffect(() => {
    function handleClickOutside(e) {
      // Source: https://developer.mozilla.org/en-US/docs/Web/API/Node/contains
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setPanelOpen(false)
      }
    }
    if (panelOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [panelOpen])

  // Called by mobile nav links to close the drawer after navigation
  function closeMenu() { setMenuOpen(false) }

  // Saves a single appearance field to the backend for logged-in users.
  // Uses dot notation (e.g. "appearance.theme") so only that field is updated.
  async function syncToBackend(patch) {
    if (!isLoggedIn) return
    try {
      const dotted = Object.fromEntries(
        Object.entries(patch).map(([k, v]) => [`appearance.${k}`, v])
      )
      await updateProfile(currentUser._id, dotted)
    } catch { /* non-critical */ }
  }

  // Toggle between light and dark theme, then persist the change
  function handleTheme() {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    syncToBackend({ theme: next })
  }

  // Change the game board background color, then persist
  function handleBoardColor(color) {
    setBoardColor(color)
    syncToBackend({ boardColor: color })
  }

  // Toggle sound on/off, then persist
  function handleSound() {
    const next = !soundOn
    setSoundOn(next)
    syncToBackend({ soundOn: next })
  }

  // Update how many lobby games are shown on the homepage, then persist
  function handleLobbyCount(e) {
    setLobbyCount(e.target.value)
    syncToBackend({ lobbyCount: Number(e.target.value) })
  }

  // Log the user out, close the mobile menu, and go to the homepage
  function handleLogout() {
    logout()
    setMenuOpen(false)
    navigate('/')
  }

  // Profile picture: show uploaded image if available, otherwise a letter avatar
  const avatarEl = currentUser?.profilePicture ? (
    <img
      src={`${import.meta.env.VITE_API_URL?.replace('/api', '')}${currentUser.profilePicture}`}
      alt={currentUser.username}
      style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
    />
  ) : (
    <div style={styles.avatar}>{currentUser?.username?.[0]?.toUpperCase() ?? '?'}</div>
  )

  return (
    <header style={styles.header}>

      {/* Desktop / main bar */}
      <div className="container header-inner">

        <Link to="/" className="header-logo">Spanish Poker Dice</Link>

        {/* Desktop navigation links */}
        <nav className="header-nav">
          <NavLink to="/lobby"       className={({ isActive }) => 'header-nav-link' + (isActive ? ' active' : '')}>Lobby</NavLink>
          <NavLink to="/tournaments" className={({ isActive }) => 'header-nav-link' + (isActive ? ' active' : '')}>Tournaments</NavLink>
          <NavLink to="/about-dice"  className={({ isActive }) => 'header-nav-link' + (isActive ? ' active' : '')}>About the Game</NavLink>
          {currentUser?.role === 'admin' && (
            <NavLink to="/admin" className={({ isActive }) => 'header-nav-link' + (isActive ? ' active' : '')}>Admin</NavLink>
          )}
        </nav>

        {/* Desktop appearance button + greeting */}
        <div className="header-right">

          {/* Appearance dropdown — positioned relative to this wrapper */}
          <div ref={panelRef} style={{ position: 'relative' }}>
            <button
              className="btn btn-secondary"
              style={{ fontSize: '0.85rem', padding: '0.4rem 0.75rem', whiteSpace: 'nowrap' }}
              onClick={() => setPanelOpen(p => !p)}
            > Appearance
            </button>

            {/* Dropdown panel — only rendered when panelOpen is true */}
            {panelOpen && (
              <div style={styles.panel}>
                <p style={styles.panelHeading}>Appearance</p>
                <div style={styles.panelRow}>
                  <span style={styles.panelLabel}>Theme</span>
                  <button className="btn btn-secondary" style={styles.smallBtn} onClick={handleTheme}>
                    {theme === 'light' ? 'Dark' : 'Light'}
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <span style={styles.panelLabel}>Board Color</span>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {BOARD_COLORS.map(c => (
                      <ColorSwatch key={c.value} color={c} active={boardColor === c.value} onClick={() => handleBoardColor(c.value)} />
                    ))}
                  </div>
                </div>
                <div style={styles.panelRow}>
                  <span style={styles.panelLabel}>Sound</span>
                  <button className="btn btn-secondary" style={styles.smallBtn} onClick={handleSound}>
                    {soundOn ? 'On' : 'Off'}
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <span style={styles.panelLabel}>Lobby games on homepage: <strong>{lobbyCount}</strong></span>
                  <input type="range" min={1} max={20} value={lobbyCount} onChange={handleLobbyCount}
                    style={{ width: '100%', accentColor: 'var(--accent)' }} />
                </div>
              </div>
            )}
          </div>

          {/* Greeting: show username + profile link + logout for logged-in users, or login/register links */}
          {isLoggedIn ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Link to={`/profile/${currentUser._id}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                {avatarEl}
                <span style={{ color: 'var(--text)', fontSize: '0.9rem' }}>
                  <strong>{currentUser.username}</strong>
                </span>
              </Link>
              <button className="btn btn-secondary" style={styles.smallBtn} onClick={handleLogout}>Log out</button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Link to="/login"    className="btn btn-secondary" style={styles.smallBtn}>Log in</Link>
              <Link to="/register" className="btn btn-primary"   style={styles.smallBtn}>Register</Link>
            </div>
          )}
        </div>

        {/* Hamburger button — hidden on desktop, shown on mobile via CSS */}
        <button
          className="header-toggle"
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Toggle menu"
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile drawer — slides open when menuOpen is true  */}
      <div className={`header-mobile${menuOpen ? ' open' : ''}`}>

        {/* Mobile navigation links — close the drawer on click */}
        <nav className="header-mobile-nav">
          <NavLink to="/lobby"       onClick={closeMenu} className={({ isActive }) => isActive ? 'active' : ''}>Lobby</NavLink>
          <NavLink to="/tournaments" onClick={closeMenu} className={({ isActive }) => isActive ? 'active' : ''}>Tournaments</NavLink>
          <NavLink to="/about-dice"  onClick={closeMenu} className={({ isActive }) => isActive ? 'active' : ''}>About the Game</NavLink>
          {currentUser?.role === 'admin' && (
            <NavLink to="/admin" onClick={closeMenu} className={({ isActive }) => isActive ? 'active' : ''}>Admin</NavLink>
          )}
        </nav>

        <hr className="header-mobile-divider" />

        {/* Appearance controls shown inline inside the mobile drawer */}
        <div className="header-mobile-appearance">
          <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-heading)' }}>Appearance</p>
          <div className="header-mobile-appearance-row">
            <span className="header-mobile-label">Theme</span>
            <button className="btn btn-secondary" style={styles.smallBtn} onClick={handleTheme}>
              {theme === 'light' ? 'Dark' : 'Light'}
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <span className="header-mobile-label">Board Color</span>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {BOARD_COLORS.map(c => (
                <ColorSwatch key={c.value} color={c} active={boardColor === c.value} onClick={() => handleBoardColor(c.value)} />
              ))}
            </div>
          </div>
          <div className="header-mobile-appearance-row">
            <span className="header-mobile-label">Sound</span>
            <button className="btn btn-secondary" style={styles.smallBtn} onClick={handleSound}>
              {soundOn ? 'On' : 'Off'}
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <span className="header-mobile-label">Lobby games on homepage: <strong>{lobbyCount}</strong></span>
            <input type="range" min={1} max={20} value={lobbyCount} onChange={handleLobbyCount}
              style={{ width: '100%', accentColor: 'var(--accent)' }} />
          </div>
        </div>

        <hr className="header-mobile-divider" />

        {/* Mobile greeting — same logic as desktop but inside the drawer */}
        <div className="header-mobile-greeting">
          {isLoggedIn ? (
            <>
              <Link to={`/profile/${currentUser._id}`} onClick={closeMenu}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'var(--text)' }}>
                {avatarEl}
                <span>Hello, <strong>{currentUser.username}</strong></span>
              </Link>
              <button className="btn btn-secondary" style={styles.smallBtn} onClick={handleLogout}>Log out</button>
            </>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Link to="/login"    onClick={closeMenu} className="btn btn-secondary" style={styles.smallBtn}>Log in</Link>
              <Link to="/register" onClick={closeMenu} className="btn btn-primary"   style={styles.smallBtn}>Register</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

const styles = {
  header: {
    background: 'var(--bg-surface)',
    borderBottom: '1px solid var(--border)',
    boxShadow: 'var(--shadow-sm)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  avatar: {
    width: 30, height: 30,
    borderRadius: '50%',
    background: 'var(--accent)',
    color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.8rem', fontWeight: 700, flexShrink: 0,
  },
  panel: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-md)',
    padding: '1rem',
    minWidth: 220,
    zIndex: 200,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.85rem',
  },
  panelHeading: { fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-heading)' },
  panelRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' },
  panelLabel: { fontSize: '0.85rem', color: 'var(--text-muted)' },
  smallBtn: { fontSize: '0.8rem', padding: '0.35rem 0.65rem' },
}