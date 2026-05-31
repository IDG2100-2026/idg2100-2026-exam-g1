import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAppearance } from "../context/AppearanceContext";
import { login as loginApi } from "../api/users";
import ErrorMessage from "../components/ui/ErrorMessage";

// Login form — validates email + password and redirects to homepage on success.
export default function LoginPage() {
  const { login } = useAuth();
  const { loadFromBackend } = useAppearance();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { accessToken, user } = await loginApi({ login: email, password });
      login(user ?? null, accessToken);
      if (user?.appearance) loadFromBackend(user.appearance);
      navigate("/");
    } catch (err) {
      const msg =
        err.response?.data?.errors?.[0]?.message ??
        err.response?.data?.message ??
        "Login failed. Please try again.";
      setError(msg);
      setShowResend(msg.toLowerCase().includes("verify"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div className="card" style={styles.card}>
        <Link to="/" style={styles.backLink}>
          ← Spanish Poker Dice
        </Link>
        <h1 style={styles.heading}>Log in</h1>

        <ErrorMessage message={error} />
        {showResend && (
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
            <Link to="/resend-verification">Resend verification email</Link>
          </p>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div className="form-group">
            <label htmlFor="email">Email or username</label>
            <input
              id="email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
              placeholder="Email or username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%" }}
            disabled={loading}
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <Link to="/forgot-password" style={styles.forgotBtn}>
          Forgot password?
        </Link>

        <p style={styles.footer}>
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--bg)",
    padding: "1.5rem",
  },
  card: {
    width: "100%",
    maxWidth: 420,
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  backLink: {
    fontSize: "0.85rem",
    color: "var(--text-muted)",
    textDecoration: "none",
  },
  heading: {
    fontSize: "1.75rem",
    marginBottom: "0.25rem",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  },
  forgotBtn: {
    fontSize: "0.85rem",
    color: "var(--text-muted)",
    textDecoration: "none",
  },
  footer: {
    fontSize: "0.875rem",
    color: "var(--text-muted)",
    textAlign: "center",
    marginTop: "0.5rem",
  },
};
