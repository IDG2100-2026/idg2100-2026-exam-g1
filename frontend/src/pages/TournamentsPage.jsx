import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listTournaments } from '../api/tournaments'
import TournamentCard from '../components/tournaments/TournamentCard'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ErrorMessage from '../components/ui/ErrorMessage'

const SORT_OPTIONS = [
  { value: 'date',    label: 'Date' },
  { value: 'title',   label: 'Title' },
  { value: 'players', label: 'Players' },
]

export default function TournamentsPage() {
  const [all, setAll]         = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  const [search, setSearch] = useState('')
  const [sort, setSort]     = useState('date')

  // Debounced search value — only sent to backend after user stops typing for 400ms
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    async function fetchAll() {
      setLoading(true)
      try {
        const params = { sort, limit: 100 }
        if (debouncedSearch.length >= 3) params.search = debouncedSearch
        const res = await listTournaments(params)
        setAll(res.results ?? [])
        setError('')
      } catch {
        setError('Failed to load tournaments.')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [sort, debouncedSearch])

  // Split into active (upcoming/ongoing) and past (finished/cancelled)
  const active = all.filter(t => t.status === 'upcoming' || t.status === 'ongoing')
  const past   = all.filter(t => t.status === 'finished' || t.status === 'cancelled')

  const noResults = !loading && !error && all.length === 0

  return (
    <div className="container">

      {/* Header */}
      <div style={styles.heading}>
        <div>
          <h1 style={styles.title}>Tournaments</h1>
          <p style={styles.sub}>Upcoming, ongoing, and past tournaments</p>
        </div>
        <Link to="/create-game" className="btn btn-primary">Create a Game</Link>
      </div>

      {/* Controls row: search + sort */}
      <div style={styles.controls}>
        <div style={styles.searchWrap}>
          <input
            type="search"
            placeholder="Search by title (min 3 chars)…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={styles.searchInput}
          />
          {search.length > 0 && search.length < 3 && (
            <span style={styles.searchHint}>Type at least 3 characters</span>
          )}
        </div>

        <div style={styles.sortGroup}>
          <span style={styles.sortLabel}>Sort by</span>
          <div style={styles.pills}>
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt.value}
                style={{ ...styles.pill, ...(sort === opt.value ? styles.pillActive : {}) }}
                onClick={() => setSort(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && <LoadingSpinner message="Loading tournaments..." />}
      <ErrorMessage message={error} />

      {noResults && (
        <p style={styles.empty}>
          {debouncedSearch.length >= 3
            ? `No tournaments found for "${debouncedSearch}".`
            : 'No tournaments available at the moment.'}
        </p>
      )}

      {/* Upcoming & Ongoing */}
      {!loading && active.length > 0 && (
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Upcoming &amp; Ongoing</h2>
          <div style={styles.grid}>
            {active.map(t => <TournamentCard key={t._id} tournament={t} />)}
          </div>
        </section>
      )}

      {/* Past tournaments */}
      {!loading && past.length > 0 && (
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Past Tournaments</h2>
          <div style={styles.grid}>
            {past.map(t => <TournamentCard key={t._id} tournament={t} />)}
          </div>
        </section>
      )}

    </div>
  )
}

const styles = {
  heading: {
    display: 'flex', alignItems: 'flex-start',
    justifyContent: 'space-between', flexWrap: 'wrap',
    gap: '1rem', marginBottom: '1.5rem',
  },
  title: { marginBottom: '0.25rem' },
  sub: { color: 'var(--text-muted)', fontSize: '0.95rem' },

  controls: {
    display: 'flex', flexWrap: 'wrap',
    alignItems: 'flex-start', gap: '1rem',
    padding: '0.75rem 1rem',
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    marginBottom: '2rem',
  },
  searchWrap: { display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, minWidth: 200 },
  searchInput: { width: '100%', boxSizing: 'border-box' },
  searchHint: { fontSize: '0.75rem', color: 'var(--text-muted)' },

  sortGroup: { display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' },
  sortLabel: { fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' },
  pills: { display: 'flex', gap: '0.3rem' },
  pill: {
    padding: '0.25rem 0.65rem', fontSize: '0.8rem',
    border: '1px solid var(--border)', borderRadius: '20px',
    background: 'transparent', color: 'var(--text)',
    cursor: 'pointer', transition: 'background 0.15s, border-color 0.15s, color 0.15s',
  },
  pillActive: { background: 'var(--accent)', borderColor: 'var(--accent)', color: '#fff' },

  section: { marginBottom: '2.5rem' },
  sectionTitle: { fontSize: '1.15rem', marginBottom: '1rem', color: 'var(--text-muted)' },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '1rem',
  },
  empty: { color: 'var(--text-muted)', marginTop: '2rem' },
}
