// Sources:
// - React useState: https://react.dev/reference/react/useState
// - React useEffect: https://react.dev/reference/react/useEffect
// - React Router useNavigate: https://reactrouter.com/en/main/hooks/use-navigate
// - React Router useLocation: https://reactrouter.com/en/main/hooks/use-location
// - React Router Link: https://reactrouter.com/en/main/components/link
// - setInterval / clearInterval: https://developer.mozilla.org/en-US/docs/Web/API/setInterval
// - Array.prototype.filter: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { listGames } from "../api/games";
import GameCard from "../components/games/GameCard";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import ErrorMessage from "../components/ui/ErrorMessage";

// Max ELO difference between a player and a lobby game before it's hidden from the list
const ELO_RANGE = 300;

// Returns average ELO for a game's players, or null if no ELO data exists
function avgElo(players) {
  const elos =
    players
      ?.map((p) => p.user?.elo?.medium)
      .filter((e) => typeof e === "number") ?? [];
  if (elos.length === 0) return null;
  return elos.reduce((a, b) => a + b, 0) / elos.length;
}

// Lobby — shows games waiting for players, filtered by ELO range for logged-in users.
// Polls every 15 s and shows a queue banner if the user is waiting for a match.
export default function LobbyPage() {
  const { isLoggedIn, currentUser } = useAuth();

  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchGames() {
    try {
      const res = await listGames({ status: "waiting", limit: 50 });
      const all = res.results ?? [];

      // Logged-in users see games within ELO range; guests see all waiting games
      const filtered = all.filter((g) => {
        if (!isLoggedIn) return true;
        const gameAvg = avgElo(g.players);
        if (gameAvg !== null && currentUser?.elo?.medium) {
          return Math.abs(gameAvg - currentUser.elo.medium) <= ELO_RANGE;
        }
        return true;
      });

      setGames(filtered);
      setError("");
    } catch {
      setError("Failed to load lobby. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchGames();
    // Source: https://developer.mozilla.org/en-US/docs/Web/API/setInterval
    const interval = setInterval(fetchGames, 15000);
    return () => clearInterval(interval);
  }, [isLoggedIn, currentUser?.elo?.medium]);

  return (
    <div className="container">
      <div style={styles.heading}>
        <div>
          <h1 style={styles.title}>Lobby</h1>
          <p style={styles.sub}>Games waiting for players to join</p>
        </div>
        <Link to="/create-game" className="btn btn-primary">
          Create a Game
        </Link>
      </div>

      {loading && <LoadingSpinner message="Loading lobby..." />}
      <ErrorMessage message={error} />

      {!loading && !error && games.length === 0 && (
        <div style={styles.empty}>
          <p>No games available to join right now.</p>
          <p style={styles.emptySub}>Be the first — create a new game!</p>
        </div>
      )}

      {!loading && games.length > 0 && (
        <div style={styles.grid}>
          {games.map((game) => (
            <GameCard key={game._id} game={game} autoJoin />
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  heading: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "1rem",
    marginBottom: "2rem",
  },
  title: { marginBottom: "0.25rem" },
  sub: { color: "var(--text-muted)", fontSize: "0.95rem" },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: "1rem",
  },
  empty: {
    textAlign: "center",
    padding: "3rem 0",
    color: "var(--text-muted)",
  },
  emptySub: {
    fontSize: "0.875rem",
    marginTop: "0.5rem",
  },
};
