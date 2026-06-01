import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createTournament, updateTournament, updateTrophy, getTournament } from '../../api/tournaments'
import ErrorMessage from '../../components/ui/ErrorMessage'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

const DEFAULTS = {
  title: '',
  description: '',
  startDate: '',
  totalRounds: '3',
  variant: 'standard',
  timeControl: '30',
  minElo: '0',
  maxElo: '9999',
  buyIn: '1',
  maxPlayers: '8',
  trophyDescription: '',
}

function toDatetimeLocal(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d)) return ''
  return d.toISOString().slice(0, 16)
}

export default function AdminTournamentCreatePage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)

  const [form, setForm] = useState(DEFAULTS)
  const [trophyFile, setTrophyFile] = useState(null)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isEdit) return
    getTournament(id)
      .then(t => {
        setForm({
          title:             t.title ?? '',
          description:       t.description ?? '',
          startDate:         toDatetimeLocal(t.startDate),
          totalRounds:       String(t.totalRounds ?? 3),
          variant:           t.variant ?? 'standard',
          timeControl:       String(t.timeControl ?? 30),
          minElo:            String(t.minElo ?? 0),
          maxElo:            String(t.maxElo ?? 9999),
          buyIn:             String(t.buyIn ?? 1),
          maxPlayers:        String(t.maxPlayers ?? 8),
          trophyDescription: t.trophy?.description ?? '',
        })
      })
      .catch(() => setError('Failed to load tournament.'))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const payload = {
        title:             form.title,
        description:       form.description,
        startDate:         form.startDate,
        totalRounds:       Number(form.totalRounds),
        variant:           form.variant,
        timeControl:       Number(form.timeControl),
        minElo:            Number(form.minElo),
        maxElo:            Number(form.maxElo),
        buyIn:             Number(form.buyIn),
        maxPlayers:        Number(form.maxPlayers),
        trophyDescription: form.trophyDescription,
      }

      const tournament = isEdit
        ? await updateTournament(id, payload)
        : await createTournament(payload)

      if (trophyFile && tournament._id) {
        await updateTrophy(tournament._id, trophyFile)
      }

      navigate(`/tournaments/${tournament._id}`)
    } catch (err) {
      const msg = err.response?.data?.errors?.[0]
        ?? err.response?.data?.message
        ?? (isEdit ? 'Failed to update tournament.' : 'Failed to create tournament.')
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingSpinner message="Loading tournament..." />

  return (
    <div style={styles.page}>
      <h1 style={styles.pageTitle}>{isEdit ? 'Edit Tournament' : 'Create Tournament'}</h1>

      <ErrorMessage message={error} />

      <form onSubmit={handleSubmit} style={styles.form}>

        <fieldset style={styles.fieldset}>
          <legend style={styles.legend}>Basic Information</legend>

          <div className="form-group">
            <label htmlFor="title">Title <span style={styles.req}>*</span></label>
            <input id="title" name="title" value={form.title} onChange={handleChange} required maxLength={50} placeholder="Tournament title" />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea id="description" name="description" value={form.description} onChange={handleChange} maxLength={500} rows={3} style={styles.textarea} placeholder="Optional description…" />
          </div>

          <div className="form-group">
            <label htmlFor="startDate">Start date &amp; time <span style={styles.req}>*</span></label>
            <input id="startDate" name="startDate" type="datetime-local" value={form.startDate} onChange={handleChange} required />
          </div>
        </fieldset>

        <fieldset style={styles.fieldset}>
          <legend style={styles.legend}>Game Rules</legend>

          <div style={styles.row}>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="variant">Variant</label>
              <select id="variant" name="variant" value={form.variant} onChange={handleChange} style={styles.select}>
                <option value="standard">Standard</option>
                <option value="straights">Straights</option>
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="timeControl">Time control</label>
              <select id="timeControl" name="timeControl" value={form.timeControl} onChange={handleChange} style={styles.select}>
                <option value="10">10s</option>
                <option value="30">30s</option>
                <option value="90">90s</option>
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="totalRounds">Rounds</label>
              <select id="totalRounds" name="totalRounds" value={form.totalRounds} onChange={handleChange} style={styles.select}>
                <option value="3">3</option>
                <option value="5">5</option>
                <option value="7">7</option>
              </select>
            </div>
          </div>

          <div style={styles.row}>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="buyIn">Buy-in (pts)</label>
              <select id="buyIn" name="buyIn" value={form.buyIn} onChange={handleChange} style={styles.select}>
                <option value="1">1</option>
                <option value="10">10</option>
                <option value="50">50</option>
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="maxPlayers">Max players</label>
              <input id="maxPlayers" name="maxPlayers" type="number" min={2} max={100} value={form.maxPlayers} onChange={handleChange} required />
            </div>
          </div>

          <div style={styles.row}>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="minElo">Min ELO</label>
              <input id="minElo" name="minElo" type="number" min={0} value={form.minElo} onChange={handleChange} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="maxElo">Max ELO</label>
              <input id="maxElo" name="maxElo" type="number" min={0} value={form.maxElo} onChange={handleChange} />
            </div>
          </div>
        </fieldset>

        <fieldset style={styles.fieldset}>
          <legend style={styles.legend}>Trophy</legend>

          <div className="form-group">
            <label htmlFor="trophyDescription">Trophy description</label>
            <textarea id="trophyDescription" name="trophyDescription" value={form.trophyDescription} onChange={handleChange} maxLength={300} rows={2} style={styles.textarea} placeholder="Describe the trophy…" />
          </div>

          <div className="form-group">
            <label htmlFor="trophyFile">Trophy image{isEdit && ' (leave blank to keep existing)'}</label>
            <input id="trophyFile" type="file" accept="image/*" onChange={e => setTrophyFile(e.target.files?.[0] ?? null)} />
          </div>
        </fieldset>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button type="submit" className="btn btn-primary" style={styles.submitBtn} disabled={saving}>
            {saving ? (isEdit ? 'Saving…' : 'Creating…') : (isEdit ? 'Save changes' : 'Create tournament')}
          </button>
          {isEdit && (
            <button type="button" className="btn btn-secondary" style={styles.submitBtn} onClick={() => navigate(`/tournaments/${id}`)}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

const styles = {
  page: { maxWidth: 680 },
  pageTitle: { marginBottom: '1.5rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  fieldset: { border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  legend: { fontWeight: 600, fontSize: '0.9rem', padding: '0 0.4rem', color: 'var(--text-muted)' },
  row: { display: 'flex', gap: '1rem', flexWrap: 'wrap' },
  select: { width: '100%', padding: '0.4rem 0.6rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text)' },
  textarea: { resize: 'vertical', minHeight: 70 },
  req: { color: 'var(--error, #c0392b)' },
  submitBtn: { alignSelf: 'flex-start', padding: '0.6rem 2rem' },
}