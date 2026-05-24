// Sources:
// - React useState: https://react.dev/reference/react/useState
// - React Router useNavigate: https://reactrouter.com/en/main/hooks/use-navigate
// - React Router Link: https://reactrouter.com/en/main/components/link
// - HTML radio input: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/radio
// - HTML checkbox input: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/checkbox

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { createGame } from '../api/games'
import ErrorMessage from '../components/ui/ErrorMessage'

// Fixed option sets for the three game variant pickers
const ROUNDS_OPTIONS    = [3, 5, 7]
const VARIANT_OPTIONS   = [
  { label: 'Standard',      value: 'standard'  },
  { label: 'Straights',     value: 'straights' },
]
const TIME_OPTIONS      = [10, 30, 90]
const PLAYERS_OPTIONS   = [2, 3, 5]
const BUYIN_OPTIONS     = [1, 10, 50]

// Reusable radio-button group that renders options as pill-style toggle buttons
function RadioGroup({ label, options, value, onChange }) {
  return (
    <div style={styles.group}>
      <p style={styles.groupLabel}>{label}</p>
      <div style={styles.radioRow}>
        {options.map(opt => {
          const val = typeof opt === 'object' ? opt.value : opt
          const lbl = typeof opt === 'object' ? opt.label : `${opt}`
          const checked = value === val
          return (
            <label key={lbl} style={{ ...styles.radioLabel, ...(checked ? styles.radioLabelActive : {}) }}>
              <input
                type="radio"
                name={label}
                value={String(val)}
                checked={checked}
                onChange={() => onChange(val)}
                style={styles.radioInput}
              />
              {lbl}
            </label>
          )
        })}
      </div>
    </div>
  )
}

// Create Game page — lets the user pick variant options and enter the matchmaking queue.
// If a match is found immediately, navigates to the game; otherwise goes to the lobby.
export default function CreateGamePage() {
  const { isLoggedIn } = useAuth()
  const navigate = useNavigate()

  const [rounds, setRounds]           = useState(3)
  const [variant, setVariant]         = useState('standard')
  const [timeControl, setTimeControl] = useState(10)
  const [maxPlayers, setMaxPlayers]   = useState(2)
  const [buyIn, setBuyIn]             = useState(1)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = { rounds, variant, timeControl, maxPlayers, buyIn }
      const res = await createGame(payload)
      navigate(`/games/${res._id}`)
    } catch (err) {
      const msg = err.response?.data?.errors?.[0]
        ?? err.response?.data?.message
        ?? 'Failed to create game. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container" style={styles.page}>
      <div style={styles.header}>
        <h1>Create a Game</h1>
        <p style={styles.sub}>Choose your game variant and find an opponent</p>
      </div>

      <div className="card" style={styles.card}>
        <ErrorMessage message={error} />

        <form onSubmit={handleSubmit} style={styles.form}>

          <RadioGroup
            label="Best of"
            options={ROUNDS_OPTIONS.map(r => ({ label: `${r} rounds`, value: r }))}
            value={rounds}
            onChange={setRounds}
          />

          <RadioGroup
            label="Variant"
            options={VARIANT_OPTIONS}
            value={variant}
            onChange={setVariant}
          />

          <RadioGroup
            label="Time control"
            options={TIME_OPTIONS.map(t => ({ label: `${t}s`, value: t }))}
            value={timeControl}
            onChange={setTimeControl}
          />

          <RadioGroup
            label="Max players"
            options={PLAYERS_OPTIONS.map(p => ({ label: `${p}`, value: p }))}
            value={maxPlayers}
            onChange={setMaxPlayers}
          />

          <RadioGroup
            label="Buy-in (points)"
            options={BUYIN_OPTIONS.map(b => ({ label: `${b}`, value: b }))}
            value={buyIn}
            onChange={setBuyIn}
          />

          <div style={styles.actions}>
            <Link to="/lobby" className="btn btn-secondary">Cancel</Link>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Finding opponent...' : 'Create Game'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const styles = {
  page: { maxWidth: 600 },
  header: { marginBottom: '1.5rem' },
  sub: { color: 'var(--text-muted)', marginTop: '0.25rem' },
  card: { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  group: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  groupLabel: { fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-heading)' },
  radioRow: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.4rem 0.85rem',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
    cursor: 'pointer',
    fontSize: '0.9rem',
    background: 'var(--bg-surface-alt)',
    color: 'var(--text)',
    userSelect: 'none',
    transition: 'border-color 0.15s',
  },
  radioLabelActive: {
    borderColor: 'var(--accent)',
    background: 'var(--accent-light)',
    color: 'var(--accent)',
  },
  radioInput: { display: 'none' },
  divider: { borderTop: '1px solid var(--border)' },
  toggleLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.9rem',
    cursor: 'pointer',
  },
  checkbox: { width: 'auto', accentColor: 'var(--accent)' },
  optional: { fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 },
  actions: {
    display: 'flex',
    gap: '0.75rem',
    justifyContent: 'flex-end',
    marginTop: '0.5rem',
  },
}
