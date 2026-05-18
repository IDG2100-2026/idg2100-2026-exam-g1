// Sources:
// - React useState: https://react.dev/reference/react/useState
// - React useEffect: https://react.dev/reference/react/useEffect
// - React useRef: https://react.dev/reference/react/useRef
// - React Router useParams: https://reactrouter.com/en/main/hooks/use-params
// - Element.scrollIntoView: https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView
// - setInterval / clearInterval: https://developer.mozilla.org/en-US/docs/Web/API/setInterval
// - CSS Grid layout: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout
// - CSS position sticky: https://developer.mozilla.org/en-US/docs/Web/CSS/position

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useAppearance } from '../context/AppearanceContext'
import { getGame } from '../api/games'
import { getComments, createComment } from '../api/comments'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ErrorMessage from '../components/ui/ErrorMessage'

// Formats the game variant into a short readable string, e.g. "Best of 5 · Straights · 10s"
function formatVariant(category) {
  if (!category) return ''
  const straights = category.straightsAllowed ? 'Straights' : 'No straights'
  return `Best of ${category.rounds} · ${straights} · ${category.timePerRound}s`
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// Game detail page — shows the board, player info, and a live comment sidebar.
// Polls every 15 s so the waiting overlay disappears once a second player joins.
export default function GamePage() {
  const { id } = useParams()
  const { currentUser, isLoggedIn } = useAuth()
  const { boardColor } = useAppearance()

  const [game, setGame]         = useState(null)
  const [comments, setComments] = useState([])
  const [loadingGame, setLoadingGame] = useState(true)
  const [gameError, setGameError]     = useState('')

  const [commentText, setCommentText] = useState('')
  const [posting, setPosting]         = useState(false)
  const [commentError, setCommentError] = useState('')

  const commentsEndRef = useRef(null)

  async function fetchGame() {
    try {
      const res = await getGame(id)
      setGame(res.data)
      setGameError('')
    } catch {
      setGameError('Failed to load game.')
    } finally {
      setLoadingGame(false)
    }
  }

  async function fetchComments() {
    const res = await getComments('game', id)
    setComments(res.data ?? [])
  }

  useEffect(() => {
    fetchGame()
    fetchComments()

    // Poll every 15 seconds for game state updates (new players joining)
    // Source: https://developer.mozilla.org/en-US/docs/Web/API/setInterval
    const interval = setInterval(() => {
      fetchGame()
      fetchComments()
    }, 15000)

    return () => clearInterval(interval)
  }, [id])

  // Scroll comments to bottom when new ones arrive
  // Source: https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments])

  async function handlePostComment(e) {
    e.preventDefault()
    if (!commentText.trim()) return
    setPosting(true)
    setCommentError('')
    try {
      const res = await createComment({ content: commentText.trim(), targetType: 'game', targetId: id })
      setCommentText('')
      // Add the new comment immediately so it appears without waiting for a GET refresh
      if (res.data) setComments(prev => [...prev, res.data])
      // Also refresh in the background to get any other new comments
      fetchComments().catch(() => {})
    } catch (err) {
      const msg = err.response?.data?.errors?.[0]
        ?? err.response?.data?.message
        ?? 'Failed to post comment.'
      setCommentError(msg)
    } finally {
      setPosting(false)
    }
  }

  if (loadingGame) return <div className="container"><LoadingSpinner message="Loading game..." /></div>
  if (gameError)   return <div className="container" style={{ paddingTop: '2rem' }}><ErrorMessage message={gameError} /></div>
  if (!game)       return null

  const isWaiting = game.status === 'waiting'

  return (
    <div className="container" style={styles.page}>

      {/* Game area */}
      <div style={styles.main}>
        <div style={styles.meta}>
          <h1 style={styles.title}>
            {game.players?.map(p => p.displayName || p.user?.username || 'Guest').join(' vs ')}
          </h1>
          <p style={styles.variant}>{formatVariant(game.category)}</p>
        </div>

        {/* Player ELO bar */}
        <div style={styles.playerBar}>
          {game.players?.map((p, i) => (
            <div key={i} style={styles.playerChip}>
              <span style={styles.playerName}>
                {p.displayName || p.user?.username || 'Guest'}
              </span>
              {p.user?.elo && (
                <span style={styles.playerElo}>ELO {p.user.elo}</span>
              )}
            </div>
          ))}
        </div>

        {/* Board area */}
        <div style={{ ...styles.board, background: boardColor, position: 'relative' }}>
          {isWaiting && (
            <div style={styles.waitingOverlay}>
              <p style={styles.waitingTitle}>Waiting for players...</p>
              <p style={styles.waitingSub}>Page refreshes automatically every 15 seconds</p>
            </div>
          )}
          {!isWaiting && (
            <p style={styles.boardPlaceholder}>
              Game board — coming in a future sprint
            </p>
          )}
        </div>
      </div>

      {/* Comments sidebar */}
      <aside style={styles.sidebar}>
        <h2 style={styles.sidebarTitle}>Comments</h2>

        <div style={styles.commentsList}>
          {comments.length === 0 && (
            <p style={styles.noComments}>No comments yet. Be the first!</p>
          )}
          {comments.map(c => (
            <div key={c._id} style={styles.comment}>
              <div style={styles.commentHeader}>
                <span style={styles.commentAuthor}>
                  {c.author?.username ?? 'Unknown'}
                </span>
                <span style={styles.commentDate}>
                  {formatDate(c.createdAt)}
                </span>
              </div>
              <p style={styles.commentText}>{c.content}</p>
            </div>
          ))}
          <div ref={commentsEndRef} />
        </div>

        {isLoggedIn ? (
          <form onSubmit={handlePostComment} style={styles.commentForm}>
            <ErrorMessage message={commentError} />
            <textarea
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="Leave a comment..."
              maxLength={500}
              rows={3}
              style={styles.textarea}
              required
            />
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%' }}
              disabled={posting || !commentText.trim()}
            >
              {posting ? 'Posting...' : 'Post'}
            </button>
          </form>
        ) : (
          <p style={styles.loginPrompt}>
            <a href="/login">Log in</a> to leave a comment.
          </p>
        )}
      </aside>
    </div>
  )
}

const styles = {
  page: {
    display: 'grid',
    gridTemplateColumns: '1fr 320px',
    gap: '1.5rem',
    alignItems: 'start',
  },
  main: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  meta: { paddingTop: '0.5rem' },
  title: { fontSize: '1.5rem', marginBottom: '0.25rem' },
  variant: { color: 'var(--text-muted)', fontSize: '0.9rem' },
  playerBar: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  playerChip: {
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '0.5rem 1rem',
  },
  playerName: { fontWeight: 600, fontSize: '0.95rem' },
  playerElo: { fontSize: '0.8rem', color: 'var(--text-muted)' },
  board: {
    width: '100%',
    minHeight: 360,
    borderRadius: 'var(--radius-lg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waitingOverlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0,0,0,0.55)',
    borderRadius: 'var(--radius-lg)',
    gap: '0.5rem',
  },
  waitingTitle: {
    color: '#fff',
    fontSize: '1.25rem',
    fontWeight: 600,
  },
  waitingSub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: '0.85rem',
  },
  boardPlaceholder: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: '0.9rem',
    fontStyle: 'italic',
  },
  sidebar: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    padding: '1.25rem',
    position: 'sticky',
    top: 76,
    maxHeight: 'calc(100vh - 100px)',
  },
  sidebarTitle: { fontSize: '1.1rem' },
  commentsList: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    maxHeight: 400,
  },
  noComments: { color: 'var(--text-muted)', fontSize: '0.875rem' },
  comment: {
    padding: '0.6rem 0.75rem',
    background: 'var(--bg-surface-alt)',
    borderRadius: 'var(--radius)',
  },
  commentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: '0.25rem',
    gap: '0.5rem',
  },
  commentAuthor: { fontWeight: 600, fontSize: '0.85rem' },
  commentDate: { fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' },
  commentText: { fontSize: '0.875rem', color: 'var(--text)', lineHeight: 1.5 },
  commentForm: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  textarea: { resize: 'vertical', minHeight: 70 },
  loginPrompt: {
    fontSize: '0.875rem',
    color: 'var(--text-muted)',
    textAlign: 'center',
    padding: '0.5rem 0',
  },
}
