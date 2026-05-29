import { useEffect, useState, useRef } from "react";
import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAppearance } from "../context/AppearanceContext";
import { getGame, joinGame, leaveGame } from "../api/games";
import { getComments } from "../api/comments";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import ErrorMessage from "../components/ui/ErrorMessage";
import { io } from "socket.io-client";
import GameBoard from "../components/game-board/GameBoard";

// Formats the game variant into a short readable string, e.g. "Best of 5 · Straights · 10s"
function formatVariant(game) {
  if (!game) return "";
  const straights = game.variant === "straights" ? "Straights" : "No straights";
  return `Best of ${game.rounds} · ${straights} · ${game.timeControl}s`;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Game detail page — shows the board, player info, and a live comment sidebar.
// Polls every 15 s so the waiting overlay disappears once a second player joins.
export default function GamePage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, isLoggedIn, token } = useAuth();
  const { boardColor } = useAppearance();

  const [game, setGame] = useState(null);
  const [comments, setComments] = useState([]);
  const [loadingGame, setLoadingGame] = useState(true);
  const [gameError, setGameError] = useState("");

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  const [commentText, setCommentText] = useState("");

  const commentsEndRef = useRef(null);
  const socketRef = useRef(null);

  async function fetchGame() {
    try {
      const res = await getGame(id);
      setGame(res);
      setGameError("");
    } catch {
      setGameError("Failed to load game.");
    } finally {
      setLoadingGame(false);
    }
  }

  async function fetchComments() {
    const res = await getComments("match", id);
    setComments(res ?? []);
  }

  async function handleJoin() {
    setActionLoading(true);
    setActionError("");
    try {
      const res = await joinGame(id);
      setGame(res);
    } catch (err) {
      setActionError(err.response?.data?.message ?? "Failed to join game.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleLeave() {
    setActionLoading(true);
    setActionError("");
    try {
      await leaveGame(id);
      navigate("/lobby");
    } catch (err) {
      setActionError(err.response?.data?.message ?? "Failed to leave game.");
    } finally {
      setActionLoading(false);
    }
  }

  useEffect(() => {
    fetchGame();
    fetchComments();

    // Poll every 15 seconds for game state updates (new players joining)
    // Source: https://developer.mozilla.org/en-US/docs/Web/API/setInterval
    const interval = setInterval(() => {
      fetchGame();
    }, 15000);

    return () => clearInterval(interval);
  }, [id]);

  // Auto-join if navigated here from the lobby with autoJoin flag
  useEffect(() => {
    if (location.state?.autoJoin && game && isLoggedIn) {
      const alreadyIn = game.players?.some(
        (p) => p.user?._id === currentUser?._id || p.user === currentUser?._id,
      );
      if (!alreadyIn && game.status === "waiting") handleJoin();
    }
  }, [game?._id]);

  // Scroll comments to bottom when new ones arrive
  // Source: https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  async function handlePostComment(e) {
    e.preventDefault();
    if (!commentText.trim()) return;

    //Send comment via socket
    socketRef.current.emit("newComment", {
      targetType: "match",
      targetId: id,
      content: commentText.trim(),
    });

    setCommentText("");
  }

  //Websocket
  useEffect(() => {
    //Connect to backend server
    const socket = io(import.meta.env.VITE_API_URL, {
      auth: { token },
    });

    //store socket
    socketRef.current = socket;

    socket.emit("joinMatch", id);

    //listen for new comments and add it to the end of the comments list
    socket.on("commentRecieved", (comment) => {
      setComments((prev) => [...prev, comment]);
    });

    //Disconnect
    return () => socket.disconnect();
  }, [id]);

  if (loadingGame)
    return (
      <div className="container">
        <LoadingSpinner message="Loading game..." />
      </div>
    );
  if (gameError)
    return (
      <div className="container" style={{ paddingTop: "2rem" }}>
        <ErrorMessage message={gameError} />
      </div>
    );
  if (!game) return null;

  const isWaiting = game.status === "waiting";
  const isInGame = game.players?.some(
    (p) => p.user?._id === currentUser?._id || p.user === currentUser?._id,
  );
  const isFull = game.players?.length >= game.maxPlayers;

  return (
    <div className="container" style={styles.page}>
      {/* Game area */}
      <div style={styles.main}>
        <div style={styles.meta}>
          <h1 style={styles.title}>
            {game.players?.map((p) => p.user?.username || "Guest").join(" vs ")}
          </h1>
          <p style={styles.variant}>{formatVariant(game)}</p>
          <p style={styles.variant}>
            Buy-in: {game.buyIn} pts · {game.players?.length ?? 0}/
            {game.maxPlayers} players
          </p>

          {/* Join / leave controls — only shown while game is waiting */}
          {isWaiting && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                marginTop: "0.5rem",
              }}
            >
              {actionError && (
                <p style={{ color: "var(--error)", fontSize: "0.85rem" }}>
                  {actionError}
                </p>
              )}
              {!isLoggedIn && (
                <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
                  <Link to="/login">Log in</Link> to join this game.
                </p>
              )}
              {isLoggedIn && !isInGame && !isFull && (
                <button
                  className="btn btn-primary"
                  onClick={handleJoin}
                  disabled={actionLoading}
                  style={{ alignSelf: "flex-start" }}
                >
                  {actionLoading ? "Joining..." : "Join game"}
                </button>
              )}
              {isLoggedIn && !isInGame && isFull && (
                <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
                  This game is full.
                </p>
              )}
              {isLoggedIn && isInGame && (
                <button
                  className="btn btn-secondary"
                  onClick={handleLeave}
                  disabled={actionLoading}
                  style={{ alignSelf: "flex-start" }}
                >
                  {actionLoading ? "Leaving..." : "Leave game"}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Player ELO bar */}
        <div style={styles.playerBar}>
          {game.players?.map((p, i) => (
            <div key={i} style={styles.playerChip}>
              <span style={styles.playerName}>
                {p.user?.username || "Guest"}
              </span>
              {p.user?.elo?.medium && (
                <span style={styles.playerElo}>ELO {p.user.elo.medium}</span>
              )}
            </div>
          ))}
        </div>

        {/* Board area */}
        {isWaiting ? (
          <div style={{ ...styles.board, background: boardColor, position: "relative" }}>
            <div style={styles.waitingOverlay}>
              <p style={styles.waitingTitle}>Waiting for players...</p>
              <p style={styles.waitingSub}>
                Page refreshes automatically every 15 seconds
              </p>
            </div>
          </div>
        ) : (
          <GameBoard game={game} currentUser={currentUser} />
        )}
      </div>

      {/* Comments sidebar */}
      <aside style={styles.sidebar}>
        <h2 style={styles.sidebarTitle}>Comments</h2>

        <div style={styles.commentsList}>
          {comments.length === 0 && (
            <p style={styles.noComments}>No comments yet. Be the first!</p>
          )}
          {comments.map((c) => (
            <div key={c._id} style={styles.comment}>
              <div style={styles.commentHeader}>
                <span style={styles.commentAuthor}>
                  {c.author?.username ?? "Unknown"}
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
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Leave a comment..."
              maxLength={500}
              rows={3}
              style={styles.textarea}
              required
            />
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%" }}
              disabled={!commentText.trim()}
            >
              Post
            </button>
          </form>
        ) : (
          <p style={styles.loginPrompt}>
            <a href="/login">Log in</a> to leave a comment.
          </p>
        )}
      </aside>
    </div>
  );
}

const styles = {
  page: {
    display: "grid",
    gridTemplateColumns: "1fr 320px",
    gap: "1.5rem",
    alignItems: "start",
  },
  main: { display: "flex", flexDirection: "column", gap: "1rem" },
  meta: { paddingTop: "0.5rem" },
  title: { fontSize: "1.5rem", marginBottom: "0.25rem" },
  variant: { color: "var(--text-muted)", fontSize: "0.9rem" },
  playerBar: {
    display: "flex",
    gap: "1rem",
    flexWrap: "wrap",
  },
  playerChip: {
    display: "flex",
    flexDirection: "column",
    background: "var(--bg-surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    padding: "0.5rem 1rem",
  },
  playerName: { fontWeight: 600, fontSize: "0.95rem" },
  playerElo: { fontSize: "0.8rem", color: "var(--text-muted)" },
  board: {
    width: "100%",
    minHeight: 360,
    borderRadius: "var(--radius-lg)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  waitingOverlay: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(0,0,0,0.55)",
    borderRadius: "var(--radius-lg)",
    gap: "0.5rem",
  },
  waitingTitle: {
    color: "#fff",
    fontSize: "1.25rem",
    fontWeight: 600,
  },
  waitingSub: {
    color: "rgba(255,255,255,0.7)",
    fontSize: "0.85rem",
  },
  sidebar: {
    background: "var(--bg-surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    padding: "1.25rem",
    position: "sticky",
    top: 76,
    maxHeight: "calc(100vh - 100px)",
  },
  sidebarTitle: { fontSize: "1.1rem" },
  commentsList: {
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    maxHeight: 400,
  },
  noComments: { color: "var(--text-muted)", fontSize: "0.875rem" },
  comment: {
    padding: "0.6rem 0.75rem",
    background: "var(--bg-surface-alt)",
    borderRadius: "var(--radius)",
  },
  commentHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: "0.25rem",
    gap: "0.5rem",
  },
  commentAuthor: { fontWeight: 600, fontSize: "0.85rem" },
  commentDate: {
    fontSize: "0.75rem",
    color: "var(--text-muted)",
    whiteSpace: "nowrap",
  },
  commentText: { fontSize: "0.875rem", color: "var(--text)", lineHeight: 1.5 },
  commentForm: { display: "flex", flexDirection: "column", gap: "0.5rem" },
  textarea: { resize: "vertical", minHeight: 70 },
  loginPrompt: {
    fontSize: "0.875rem",
    color: "var(--text-muted)",
    textAlign: "center",
    padding: "0.5rem 0",
  },
};
