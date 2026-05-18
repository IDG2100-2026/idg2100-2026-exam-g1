// Sources:
// - React useState: https://react.dev/reference/react/useState
// - React Router useNavigate: https://reactrouter.com/en/main/hooks/use-navigate
// - React Router Link: https://reactrouter.com/en/main/components/link
// - HTML radio input: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/radio
// - HTML checkbox input: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/checkbox

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { joinQueue } from '../api/games'
import ErrorMessage from '../components/ui/ErrorMessage'

// Fixed option sets for the three game variant pickers
const ROUNDS_OPTIONS   = [3, 5, 7]
const STRAIGHTS_OPTIONS = [
  { label: 'Allowed',     value: true  },
  { label: 'Not allowed', value: false },
]
const TIME_OPTIONS = [3, 10, 30]

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
  const [straights, setStraights]     = useState(true)
  const [timePerRound, setTimePerRound] = useState(10)
  const [allowAnon, setAllowAnon]     = useState(false)
  const [desiredElo, setDesiredElo]   = useState('')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = {
        category: { rounds, straightsAllowed: straights, timePerRound },
        anonymous: isLoggedIn ? allowAnon : true,
        ...(desiredElo ? { desiredElo: Number(desiredElo) } : {}),
      }
      const res = await joinQueue(payload)
      if (res.matched && res.data?._id) {
        navigate(`/games/${res.data._id}`)
      } else {
        // No immediate match — go to lobby, game will appear there
        navigate('/lobby', { state: { queued: true } })
      }
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
            label="Straights"
            options={STRAIGHTS_OPTIONS}
            value={straights}
            onChange={setStraights}
          />

          <RadioGroup
            label="Time per round"
            options={TIME_OPTIONS.map(t => ({ label: `${t}s`, value: t }))}
            value={timePerRound}
            onChange={setTimePerRound}
          />

          <div style={styles.divider} />

          {isLoggedIn && (
            <label style={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={allowAnon}
                onChange={e => setAllowAnon(e.target.checked)}
                style={styles.checkbox}
              />
              Allow anonymous players to join
            </label>
          )}

          <div className="form-group" style={{ maxWidth: 220 }}>
            <label htmlFor="desiredElo">
              Desired opponent ELO{' '}
              <span style={styles.optional}>(optional)</span>
            </label>
            <input
              id="desiredElo"
              type="number"
              min={0}
              max={3000}
              value={desiredElo}
              onChange={e => setDesiredElo(e.target.value)}
              placeholder="e.g. 1200"
            />
          </div>

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
