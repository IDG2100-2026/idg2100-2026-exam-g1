// Sources:
// - React Router Link: https://reactrouter.com/en/main/components/link

import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer style={styles.footer}>
      <div className="container" style={styles.inner}>

        <div style={styles.links}>
          <Link to="/about" style={styles.link}>About Us</Link>
          <Link to="/privacy" style={styles.link}>Privacy Policy</Link>
          <Link to="/terms" style={styles.link}>Terms &amp; Conditions</Link>
        </div>

        <p style={styles.copy}>
          Spanish Poker Dice &copy; 2025&ndash;2027
        </p>

      </div>
    </footer>
  )
}

const styles = {
  footer: {
    background: 'var(--bg-surface)',
    borderTop: '1px solid var(--border)',
    marginTop: 'auto',
  },
  inner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '0.75rem',
    padding: '1rem 1.25rem',
    fontSize: '0.875rem',
    color: 'var(--text-muted)',
  },
  links: {
    display: 'flex',
    gap: '1.25rem',
    flexWrap: 'wrap',
  },
  link: {
    color: 'var(--text-muted)',
    textDecoration: 'none',
    transition: 'color 0.15s',
  },
  copy: {
    color: 'var(--text-muted)',
  },
}
