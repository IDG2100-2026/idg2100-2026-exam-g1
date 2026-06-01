import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getProfile,
  updateProfile,
  uploadAvatar,
  updatePassword,
  getUserGames,
} from "../api/users";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import ErrorMessage from "../components/ui/ErrorMessage";

function formatVariant(game) {
  if (!game) return "—";
  const straights = game.variant === "straights" ? "Straights" : "No straights";
  return `Best of ${game.rounds} · ${straights} · ${game.timeControl}s`;
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function lastMonthStats(recentGames, userId) {
  const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recent = (recentGames ?? []).filter(
    (g) => new Date(g.createdAt) >= oneMonthAgo && g.status === "finished",
  );
  const wins = recent.filter(
    (g) =>
      g.winner?._id?.toString() === userId || g.winner?.toString() === userId,
  ).length;
  const losses = recent.length - wins;
  return { wins, losses, total: recent.length };
}

export default function UserProfilePage() {
  const { id } = useParams();
  const { currentUser, isLoggedIn, updateUser } = useAuth();
  const isOwner = isLoggedIn && currentUser?._id === id;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [aboutEdit, setAboutEdit] = useState(false);
  const [aboutText, setAboutText] = useState("");
  const [aboutSaving, setAboutSaving] = useState(false);
  const [aboutError, setAboutError] = useState("");

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");

  const [pwForm, setPwForm] = useState({
    oldPassword: "",
    password: "",
    confirm: "",
  });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");

  const [recentGames, setRecentGames] = useState([]);

  useEffect(() => {
    getUserGames(id, { limit: 10 })
      .then((res) => setRecentGames(res.results ?? []))
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      setError("");
      try {
        const res = await getProfile(id);
        setProfile(res);
        setAboutText(res.bio ?? "");
      } catch {
        setError("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [id]);

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    setAvatarError("");
    try {
      const res = await uploadAvatar(id, file);
      setProfile((prev) => ({ ...prev, profilePicture: res.profilePicture }));
      if (isOwner) updateUser({ profilePicture: res.profilePicture });
    } catch {
      setAvatarError("Failed to upload image.");
    } finally {
      setAvatarUploading(false);
    }
  }

  async function saveAbout() {
    setAboutSaving(true);
    setAboutError("");
    try {
      const res = await updateProfile(id, { bio: aboutText });
      setProfile((prev) => ({ ...prev, bio: res.bio }));
      if (isOwner) updateUser({ bio: res.bio });
      setAboutEdit(false);
    } catch (err) {
      setAboutError(err.response?.data?.message ?? "Failed to save.");
    } finally {
      setAboutSaving(false);
    }
  }

  async function savePassword(e) {
    e.preventDefault();
    setPwError("");
    setPwSuccess("");
    if (!pwForm.oldPassword) return setPwError("Current password is required.");
    if (pwForm.password !== pwForm.confirm)
      return setPwError("Passwords do not match.");
    if (pwForm.password.length < 6)
      return setPwError("Password must be at least 6 characters.");
    if (!/[0-9]/.test(pwForm.password))
      return setPwError("Password must contain at least one number.");
    if (!/[A-Z]/.test(pwForm.password))
      return setPwError("Password must contain at least one uppercase letter.");
    setPwSaving(true);
    try {
      await updatePassword(id, {
        oldPassword: pwForm.oldPassword,
        newPassword: pwForm.password,
      });
      setPwSuccess("Password updated successfully.");
      setPwForm({ oldPassword: "", password: "", confirm: "" });
    } catch (err) {
      setPwError(err.response?.data?.message ?? "Failed to update password.");
    } finally {
      setPwSaving(false);
    }
  }

  if (loading)
    return (
      <div className="container">
        <LoadingSpinner message="Loading profile..." />
      </div>
    );
  if (error)
    return (
      <div className="container" style={{ paddingTop: "2rem" }}>
        <ErrorMessage message={error} />
      </div>
    );
  if (!profile) return null;

  const stats = lastMonthStats(recentGames, id);

  return (
    <div className="container" style={styles.page}>
      <div className="card" style={styles.profileCard}>
        <div style={styles.avatarRow}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            {profile.profilePicture ? (
              <img
                src={`${import.meta.env.VITE_API_URL?.replace("/api", "")}${profile.profilePicture}`}
                alt={profile.username}
                style={styles.avatarImg}
              />
            ) : (
              <div style={styles.avatar}>
                {profile.username?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}
            {isOwner && (
              <label
                style={styles.avatarUploadLabel}
                title={avatarUploading ? "Uploading..." : "Change photo"}
              >
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: "none" }}
                  onChange={handleAvatarChange}
                  disabled={avatarUploading}
                />
                {avatarUploading ? "..." : "📷"}
              </label>
            )}
          </div>
          <div>
            <h1 style={styles.username}>{profile.username}</h1>
            {isOwner && <p style={styles.email}>{profile.email}</p>}
            <p style={styles.joined}>Joined {formatDate(profile.createdAt)}</p>
            {avatarError && (
              <p
                style={{
                  color: "var(--error)",
                  fontSize: "0.8rem",
                  marginTop: "0.25rem",
                }}
              >
                {avatarError}
              </p>
            )}
          </div>
        </div>

        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>About me</h2>
            {isOwner && !aboutEdit && (
              <button
                className="btn btn-secondary"
                style={styles.smallBtn}
                onClick={() => setAboutEdit(true)}
              >
                Edit
              </button>
            )}
          </div>
          {aboutEdit ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              <ErrorMessage message={aboutError} />
              <textarea
                value={aboutText}
                onChange={(e) => setAboutText(e.target.value)}
                maxLength={500}
                rows={4}
                style={styles.textarea}
              />
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  className="btn btn-primary"
                  style={styles.smallBtn}
                  onClick={saveAbout}
                  disabled={aboutSaving}
                >
                  {aboutSaving ? "Saving..." : "Save"}
                </button>
                <button
                  className="btn btn-secondary"
                  style={styles.smallBtn}
                  onClick={() => {
                    setAboutEdit(false);
                    setAboutText(profile.bio ?? "");
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p style={styles.aboutText}>
              {profile.bio || (
                <span style={{ color: "var(--text-muted)" }}>
                  No description yet.
                </span>
              )}
            </p>
          )}
        </div>
      </div>

      <div style={styles.grid}>
        <div className="card" style={styles.section}>
          <h2 style={styles.sectionTitle}>Stats</h2>
          <div style={styles.statsGrid}>
            <div style={styles.statItem}>
              <span style={styles.statValue}>{profile.elo?.short ?? "—"}</span>
              <span style={styles.statLabel}>ELO (10s)</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statValue}>{profile.elo?.medium ?? "—"}</span>
              <span style={styles.statLabel}>ELO (30s)</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statValue}>{profile.elo?.long ?? "—"}</span>
              <span style={styles.statLabel}>ELO (90s)</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statValue}>{profile.totalGames ?? "—"}</span>
              <span style={styles.statLabel}>Games played</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statValue}>{profile.wins ?? "—"}</span>
              <span style={styles.statLabel}>Total wins</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statValue}>{stats.wins}</span>
              <span style={styles.statLabel}>Wins (last 30 days)</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statValue}>{stats.losses}</span>
              <span style={styles.statLabel}>Losses (last 30 days)</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statValue}>{profile.points ?? 0}</span>
              <span style={styles.statLabel}>Points balance</span>
            </div>
          </div>
        </div>

        <div className="card" style={styles.section}>
          <h2 style={styles.sectionTitle}>Trophies</h2>
          {profile.trophies?.length > 0 ? (
            <div style={styles.trophyList}>
              {profile.trophies.map((t) => (
                <div key={t._id} style={styles.trophy}>
                  <span style={styles.trophyIcon}>🏆</span>
                  <span style={styles.trophyTitle}>{t.title}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={styles.empty}>No trophies yet.</p>
          )}
        </div>

        {isOwner && (
          <div className="card" style={styles.section}>
            <h2 style={styles.sectionTitle}>Change Password</h2>
            <form onSubmit={savePassword} style={styles.pwForm}>
              <ErrorMessage message={pwError} />
              {pwSuccess && <p style={styles.success}>{pwSuccess}</p>}
              <div className="form-group">
                <label htmlFor="pw-old">Current password</label>
                <input
                  id="pw-old"
                  type="password"
                  value={pwForm.oldPassword}
                  onChange={(e) =>
                    setPwForm((p) => ({ ...p, oldPassword: e.target.value }))
                  }
                  required
                  placeholder="Your current password"
                  autoComplete="current-password"
                />
              </div>
              <div className="form-group">
                <label htmlFor="pw-new">New password</label>
                <input
                  id="pw-new"
                  type="password"
                  value={pwForm.password}
                  onChange={(e) =>
                    setPwForm((p) => ({ ...p, password: e.target.value }))
                  }
                  minLength={6}
                  required
                  placeholder="Min 6 chars, one number, one uppercase"
                  autoComplete="new-password"
                />
              </div>
              <div className="form-group">
                <label htmlFor="pw-confirm">Confirm new password</label>
                <input
                  id="pw-confirm"
                  type="password"
                  value={pwForm.confirm}
                  onChange={(e) =>
                    setPwForm((p) => ({ ...p, confirm: e.target.value }))
                  }
                  required
                  placeholder="Repeat new password"
                  autoComplete="new-password"
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                style={styles.smallBtn}
                disabled={pwSaving}
              >
                {pwSaving ? "Saving..." : "Update password"}
              </button>
            </form>
          </div>
        )}
      </div>

      <div className="card" style={{ ...styles.section, marginTop: "1.5rem" }}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Last 10 Games</h2>
          <Link to={`/profile/${id}/games`} style={styles.viewAll}>
            View all games →
          </Link>
        </div>
        {recentGames?.length > 0 ? (
          <div style={styles.gamesList}>
            {recentGames.map((g) => {
              const won =
                g.winner?._id?.toString() === id || g.winner?.toString() === id;
              return (
                <Link key={g._id} to={`/games/${g._id}`} className="game-row">
                  <span
                    style={{
                      ...styles.gameResult,
                      color: won ? "var(--success)" : "var(--error)",
                    }}
                  >
                    {g.status === "finished"
                      ? won
                        ? "Win"
                        : "Loss"
                      : g.status}
                  </span>
                  <span style={styles.gameVariant}>{formatVariant(g)}</span>
                  <span style={styles.gamePlayers}>
                    {g.players
                      ?.map((p) => p.user?.username || p.displayName || "Guest")
                      .join(" vs ")}
                  </span>
                  <span style={styles.gameDate}>{formatDate(g.createdAt)}</span>
                </Link>
              );
            })}
          </div>
        ) : (
          <p style={styles.empty}>No games yet.</p>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { display: "flex", flexDirection: "column", gap: "1.5rem" },
  profileCard: { display: "flex", flexDirection: "column", gap: "1.25rem" },
  avatarRow: { display: "flex", alignItems: "center", gap: "1.25rem" },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: "50%",
    background: "var(--accent)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.5rem",
    fontWeight: 700,
  },
  avatarImg: {
    width: 64,
    height: 64,
    borderRadius: "50%",
    objectFit: "cover",
  },
  avatarUploadLabel: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: "50%",
    background: "var(--bg-surface)",
    border: "2px solid var(--border)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: 1,
    fontSize: "0.65rem",
    cursor: "pointer",
    boxShadow: "var(--shadow-sm)",
  },
  username: {
    fontSize: "1.5rem",
    marginBottom: "0.15rem",
    wordBreak: "break-all",
  },
  email: { fontSize: "0.875rem", color: "var(--text-muted)" },
  joined: {
    fontSize: "0.8rem",
    color: "var(--text-muted)",
    marginTop: "0.1rem",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "1.5rem",
  },
  section: { display: "flex", flexDirection: "column", gap: "0.75rem" },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: { fontSize: "1.1rem" },
  smallBtn: { fontSize: "0.85rem", padding: "0.35rem 0.75rem" },
  aboutText: { fontSize: "0.9rem", lineHeight: 1.6, color: "var(--text)" },
  textarea: { resize: "vertical", minHeight: 80 },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1rem",
  },
  statItem: { display: "flex", flexDirection: "column", gap: "0.15rem" },
  statValue: {
    fontSize: "1.4rem",
    fontWeight: 700,
    color: "var(--text-heading)",
  },
  statLabel: { fontSize: "0.78rem", color: "var(--text-muted)" },
  trophyList: { display: "flex", flexDirection: "column", gap: "0.5rem" },
  trophy: { display: "flex", alignItems: "center", gap: "0.5rem" },
  trophyIcon: { fontSize: "1.2rem" },
  trophyTitle: { fontSize: "0.9rem", fontWeight: 500 },
  pwForm: { display: "flex", flexDirection: "column", gap: "0.5rem" },
  success: {
    color: "var(--success)",
    fontSize: "0.875rem",
    background: "var(--success-light)",
    padding: "0.5rem 0.75rem",
    borderRadius: "var(--radius)",
  },
  gamesList: { display: "flex", flexDirection: "column", gap: "0.5rem" },
  gameRow: {
    display: "grid",
    gridTemplateColumns: "60px 1fr 1fr auto",
    gap: "0.75rem",
    alignItems: "center",
    padding: "0.6rem 0.75rem",
    background: "var(--bg-surface-alt)",
    borderRadius: "var(--radius)",
    textDecoration: "none",
    color: "var(--text)",
    fontSize: "0.875rem",
  },
  gameResult: { fontWeight: 700, fontSize: "0.85rem" },
  gameVariant: { color: "var(--text-muted)", fontSize: "0.8rem" },
  gamePlayers: { fontWeight: 500 },
  gameDate: {
    color: "var(--text-muted)",
    fontSize: "0.78rem",
    whiteSpace: "nowrap",
  },
  empty: { color: "var(--text-muted)", fontSize: "0.875rem" },
  viewAll: { fontSize: "0.875rem", color: "var(--accent)" },
};
