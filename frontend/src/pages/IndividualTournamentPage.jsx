import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { io } from 'socket.io-client'
import {
  getTournament,
  joinTournament,
  leaveTournament,
  cancelTournament,
  deleteTournament,
} from '../api/tournaments'
import { listGames } from '../api/games'
import { getComments } from '../api/comments'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ErrorMessage from '../components/ui/ErrorMessage'

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatCommentDate(dateStr) {
  return new Date(dateStr).toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatVariant(t) {
  if (!t) return ''
  const straights = t.variant === 'straights' ? 'Straights' : 'No straights'
  return `${straights} · ${t.totalRounds} rounds · ${t.timeControl}s`
}

function calcCountdown(targetDate) {
  const diff = new Date(targetDate) - Date.now()
  if (diff <= 0) return 'Starting now'
  const d = Math.floor(diff / 86400000)
  const h = Math.floor((diff % 86400000) / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  return [d && `${d}d`, h && `${h}h`, m && `${m}m`, `${s}s`].filter(Boolean).join(' ')
}

const STATUS_STYLE = {
  upcoming:  { background: 'var(--accent, #4a90e2)', color: '#fff' },
  ongoing:   { background: '#2e7d32', color: '#fff' },
  finished:  { background: 'var(--bg-surface-alt, #555)', color: 'var(--text-muted)' },
  cancelled: { background: '#b71c1c', color: '#fff' },
}

export default function TournamentPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentUser, isLoggedIn, token } = useAuth()

  const [tournament, setTournament] = useState(null)
  const [comments, setComments]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')

  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError]     = useState('')

  const [commentText, setCommentText] = useState('')

  const [countdown, setCountdown] = useState('')
  const [ongoingGames, setOngoingGames] = useState([])
  const commentsEndRef = useRef(null)
  const socketRef = useRef(null)

  async function fetchTournament() {
    try {
      const res = await getTournament(id)
      setTournament(res)
      setError('')
    } catch {
      setError('Failed to load tournament.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTournament()

    getComments('tournament', id)
      .then(res => setComments(res ?? []))
      .catch(() => {})

    const socket = io(import.meta.env.VITE_API_URL, { auth: { token } })
    socketRef.current = socket
    socket.emit('joinMatch', id)
    socket.on('commentReceived', comment => setComments(prev => [...prev, comment]))
    return () => socket.disconnect()
  }, [id])

  useEffect(() => {
    if (!tournament?.startDate || tournament.status !== 'upcoming') return
    setCountdown(calcCountdown(tournament.startDate))
    const interval = setInterval(() => setCountdown(calcCountdown(tournament.startDate)), 1000)
    return () => clearInterval(interval)
  }, [tournament?.startDate, tournament?.status])

  useEffect(() => {
    if (tournament?.status !== 'ongoing') return

    async function fetchOngoingGames() {
      try {
        const res = await listGames({ tournament: id, status: 'ongoing' })
        const games = res.results ?? []
        setOngoingGames(games)

        if (currentUser) {
          const myGame = games.find(g =>
            g.players?.some(p => p.user?._id === currentUser._id || p.user === currentUser._id)
          )
          if (myGame) navigate(`/games/${myGame._id}`)
        }
      } catch { /* non-fatal */ }
    }

    fetchOngoingGames()
    const interval = setInterval(fetchOngoingGames, 15000)
    return () => clearInterval(interval)
  }, [tournament?.status, id, currentUser?._id])

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments])

  async function handleJoin() {
    setActionLoading(true)
    setActionError('')
    try {
      const res = await joinTournament(id)
      setTournament(res)
    } catch (err) {
      setActionError(err.response?.data?.message ?? 'Failed to join tournament.')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleLeave() {
    setActionLoading(true)
    setActionError('')
    try {
      await leaveTournament(id)
      await fetchTournament()
    } catch (err) {
      setActionError(err.response?.data?.message ?? 'Failed to leave tournament.')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleCancel() {
    if (!window.confirm('Cancel this tournament? Players will still be able to view it.')) return
    setActionLoading(true)
    setActionError('')
    try {
      const res = await cancelTournament(id)
      setTournament(res)
    } catch (err) {
      setActionError(err.response?.data?.message ?? 'Failed to cancel tournament.')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this tournament permanently? This cannot be undone.')) return
    setActionLoading(true)
    setActionError('')
    try {
      await deleteTournament(id)
      navigate('/tournaments')
    } catch (err) {
      setActionError(err.response?.data?.message ?? 'Failed to delete tournament.')
    } finally {
      setActionLoading(false)
    }
  }

  function handlePostComment(e) {
    e.preventDefault()
    if (!commentText.trim()) return
    socketRef.current.emit('newComment', {
      targetType: 'tournament',
      targetId: id,
      content: commentText.trim(),
    })
    setCommentText('')
  }

  if (loading) return <div className="container"><LoadingSpinner message="Loading tournament..." /></div>
  if (error)   return <div className="container" style={{ paddingTop: '2rem' }}><ErrorMessage message={error} /></div>
  if (!tournament) return null

  const isOwner        = tournament.owner?._id === currentUser?._id || tournament.owner === currentUser?._id
  const canAdminister  = isOwner || currentUser?.role === 'admin'
  const isJoined  = tournament.players?.some(p => p.user?._id === currentUser?._id || p.user === currentUser?._id)
  const isFull    = tournament.players?.length >= tournament.maxPlayers
  const canJoin   = isLoggedIn && !isJoined && !isFull && tournament.status === 'upcoming'
  const canLeave  = isLoggedIn && isJoined
  const status    = tournament.status ?? 'upcoming'
  const apiBase   = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'

  return (
    <div className="container" style={styles.page}>

      <div style={styles.main}>

        <div>
          <Link to="/tournaments" style={styles.backLink}>← All tournaments</Link>
          <div style={styles.titleRow}>
            <h1 style={styles.title}>{tournament.title}</h1>
            <span style={{ ...styles.statusBadge, ...(STATUS_STYLE[status] ?? {}) }}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </div>
          {tournament.description && (
            <p style={styles.description}>{tournament.description}</p>
          )}
        </div>

        {/* Meta strip */}
        <div style={styles.metaStrip}>
          <MetaItem label="Variant"    value={formatVariant(tournament)} />
          <MetaItem label="Buy-in"     value={`${tournament.buyIn} pts`} />
          <MetaItem label="Players"    value={`${tournament.players?.length ?? 0} / ${tournament.maxPlayers}`} />
          <MetaItem label="ELO range"  value={`${tournament.minElo} – ${tournament.maxElo}`} />
          <MetaItem label="Starts"     value={formatDate(tournament.startDate)} />
          {tournament.owner?.username && (
            <MetaItem label="Organiser" value={tournament.owner.username} />
          )}
        </div>

        {(tournament.trophyImage || tournament.trophyDescription) && (
          <div style={styles.trophy}>
            {tournament.trophyImage && (
              <img
                src={`${apiBase}${tournament.trophyImage}`}
                alt="Tournament trophy"
                style={styles.trophyImg}
              />
            )}
            {tournament.trophyDescription && (
              <p style={styles.trophyDesc}>{tournament.trophyDescription}</p>
            )}
          </div>
        )}

        {status === 'upcoming' && countdown && (
          <div style={styles.countdown}>
            <span style={styles.countdownLabel}>Starts in</span>
            <span style={styles.countdownValue}>{countdown}</span>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {actionError && <p style={{ color: 'var(--error)', fontSize: '0.875rem' }}>{actionError}</p>}

          {!isLoggedIn && status === 'upcoming' && (
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              <Link to="/login">Log in</Link> to join this tournament.
            </p>
          )}

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {canJoin && (
              <button className="btn btn-primary" onClick={handleJoin} disabled={actionLoading}>
                {actionLoading ? 'Joining…' : 'Join tournament'}
              </button>
            )}
            {isLoggedIn && !isJoined && isFull && status === 'upcoming' && (
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Tournament is full.</p>
            )}
            {canLeave && (
              <button className="btn btn-secondary" onClick={handleLeave} disabled={actionLoading}>
                {actionLoading ? 'Leaving…' : 'Leave tournament'}
              </button>
            )}

            {canAdminister && status !== 'finished' && status !== 'cancelled' && (
              <button className="btn btn-secondary" onClick={handleCancel} disabled={actionLoading}>
                Cancel tournament
              </button>
            )}
            {canAdminister && (
              <>
                <Link to={`/admin/tournaments/${id}/edit`} className="btn btn-secondary">Edit</Link>
                <button
                  className="btn"
                  style={{ background: 'var(--error, #c0392b)', color: '#fff', border: 'none' }}
                  onClick={handleDelete}
                  disabled={actionLoading}
                >
                  Delete
                </button>
              </>
            )}
          </div>
        </div>

        {(status === 'upcoming' || status === 'ongoing') && (
          <section>
            <h2 style={styles.sectionTitle}>
              Players ({tournament.players?.length ?? 0})
            </h2>
            {tournament.players?.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No players have joined yet.</p>
            ) : (
              <div style={styles.playerList}>
                {tournament.players?.map((p, i) => (
                  <div key={i} style={styles.playerChip}>
                    <Link to={`/profile/${p.user?._id}`} style={styles.playerName}>
                      {p.user?.username ?? 'Unknown'}
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {status === 'ongoing' && (
          <section>
            <h2 style={styles.sectionTitle}>Ongoing Games</h2>
            {ongoingGames.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                {isJoined ? 'Waiting for your next round to be assigned…' : 'No games in progress right now.'}
              </p>
            ) : (
              <div style={styles.gameList}>
                {ongoingGames.map(g => (
                  <Link key={g._id} to={`/games/${g._id}`} style={styles.gameRow}>
                    <span style={styles.gamePlayers}>
                      {g.players?.map(p => p.user?.username ?? 'Unknown').join(' vs ')}
                    </span>
                    <span style={styles.gameWatch}>Watch →</span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        {(status === 'ongoing' || status === 'finished') && tournament.standings?.length > 0 && (
          <section>
            <h2 style={styles.sectionTitle}>Standings</h2>
            <div style={styles.standingsTable}>
              <div style={styles.standingsHeader}>
                <span>#</span><span>Player</span><span>Points</span>
              </div>
              {tournament.standings.map(row => (
                <div key={row.position} style={styles.standingsRow}>
                  <span style={styles.standingsPos}>{row.position}</span>
                  <Link to={`/profile/${row.user?._id}`} style={styles.playerName}>
                    {row.user?.username ?? 'Unknown'}
                  </Link>
                  <span>{row.points ?? 0}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {status === 'finished' && tournament.winner && (
          <div style={styles.winnerBanner}>
            🏆 Winner: <strong>{tournament.winner?.username ?? 'Unknown'}</strong>
          </div>
        )}
      </div>

      <aside style={styles.sidebar}>
        <h2 style={styles.sidebarTitle}>Comments</h2>

        <div style={styles.commentsList}>
          {comments.length === 0 && (
            <p style={styles.noComments}>No comments yet. Be the first!</p>
          )}
          {comments.map(c => (
            <div key={c._id} style={styles.comment}>
              <div style={styles.commentHeader}>
                <span style={styles.commentAuthor}>{c.author?.username ?? 'Unknown'}</span>
                <span style={styles.commentDate}>{formatCommentDate(c.createdAt)}</span>
              </div>
              <p style={styles.commentText}>{c.content}</p>
            </div>
          ))}
          <div ref={commentsEndRef} />
        </div>

        {isLoggedIn ? (
          <form onSubmit={handlePostComment} style={styles.commentForm}>
            <textarea
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="Leave a comment…"
              maxLength={500}
              rows={3}
              style={styles.textarea}
              required
            />
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%' }}
              disabled={!commentText.trim()}
            >
              Post
            </button>
          </form>
        ) : (
          <p style={styles.loginPrompt}>
            <Link to="/login">Log in</Link> to leave a comment.
          </p>
        )}
      </aside>
    </div>
  )
}

function MetaItem({ label, value }) {
  return (
    <div style={styles.metaItem}>
      <span style={styles.metaLabel}>{label}</span>
      <span style={styles.metaValue}>{value}</span>
    </div>
  )
}

const styles = {
  page: {
    display: 'grid',
    gridTemplateColumns: '1fr 320px',
    gap: '1.5rem',
    alignItems: 'start',
    paddingTop: '1rem',
  },
  main: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },

  backLink: { fontSize: '0.85rem', color: 'var(--text-muted)', textDecoration: 'none' },
  titleRow: { display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.4rem' },
  title: { fontSize: '1.75rem', margin: 0 },
  statusBadge: {
    fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
    padding: '0.2rem 0.6rem', borderRadius: '20px', letterSpacing: '0.05em',
  },
  description: { color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.5rem', lineHeight: 1.6 },

  metaStrip: {
    display: 'flex', flexWrap: 'wrap', gap: '0.75rem',
    padding: '0.75rem 1rem',
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
  },
  metaItem: { display: 'flex', flexDirection: 'column', gap: '0.1rem', minWidth: '90px' },
  metaLabel: { fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  metaValue: { fontSize: '0.875rem', fontWeight: 600 },

  trophy: {
    display: 'flex', gap: '1.25rem', alignItems: 'flex-start', flexWrap: 'wrap',
    padding: '1rem',
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
  },
  trophyImg: { width: 120, height: 120, objectFit: 'cover', borderRadius: 'var(--radius)' },
  trophyDesc: { fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0, flex: 1 },

  countdown: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem',
    padding: '1rem',
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    textAlign: 'center',
  },
  countdownLabel: { fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' },
  countdownValue: { fontSize: '1.75rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: 'var(--accent)' },

  sectionTitle: { fontSize: '1.1rem', marginBottom: '0.75rem' },

  gameList: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  gameRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '0.6rem 0.75rem',
    background: 'var(--bg-surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', textDecoration: 'none',
  },
  gamePlayers: { fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)' },
  gameWatch: { fontSize: '0.8rem', color: 'var(--accent)' },

  playerList: { display: 'flex', flexWrap: 'wrap', gap: '0.5rem' },
  playerChip: {
    background: 'var(--bg-surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', padding: '0.35rem 0.75rem',
  },
  playerName: { fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)', textDecoration: 'none' },

  standingsTable: { display: 'flex', flexDirection: 'column', gap: '0.3rem' },
  standingsHeader: {
    display: 'grid', gridTemplateColumns: '2rem 1fr auto',
    padding: '0.35rem 0.75rem',
    fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase',
  },
  standingsRow: {
    display: 'grid', gridTemplateColumns: '2rem 1fr auto',
    padding: '0.5rem 0.75rem', alignItems: 'center',
    background: 'var(--bg-surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', fontSize: '0.875rem',
  },
  standingsPos: { fontWeight: 700, color: 'var(--text-muted)' },

  winnerBanner: {
    padding: '1rem',
    background: 'rgba(232,200,74,0.12)',
    border: '1px solid rgba(232,200,74,0.4)',
    borderRadius: 'var(--radius)',
    fontSize: '1rem', textAlign: 'center',
  },

  sidebar: {
    background: 'var(--bg-surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column',
    gap: '1rem', padding: '1.25rem', position: 'sticky', top: 76,
    maxHeight: 'calc(100vh - 100px)',
  },
  sidebarTitle: { fontSize: '1.1rem' },
  commentsList: {
    flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column',
    gap: '0.75rem', maxHeight: 400,
  },
  noComments: { color: 'var(--text-muted)', fontSize: '0.875rem' },
  comment: { padding: '0.6rem 0.75rem', background: 'var(--bg-surface-alt)', borderRadius: 'var(--radius)' },
  commentHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
    marginBottom: '0.25rem', gap: '0.5rem',
  },
  commentAuthor: { fontWeight: 600, fontSize: '0.85rem' },
  commentDate: { fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' },
  commentText: { fontSize: '0.875rem', color: 'var(--text)', lineHeight: 1.5, margin: 0 },
  commentForm: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  textarea: { resize: 'vertical', minHeight: 70 },
  loginPrompt: { fontSize: '0.875rem', color: 'var(--text-muted)', textAlign: 'center', padding: '0.5rem 0' },
}
