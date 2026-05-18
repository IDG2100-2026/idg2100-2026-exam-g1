// Sources:
// - CSS @keyframes animation: https://developer.mozilla.org/en-US/docs/Web/CSS/@keyframes
// - CSS animation property: https://developer.mozilla.org/en-US/docs/Web/CSS/animation
// - Inline <style> in React JSX: https://react.dev/reference/react-dom/components/style

// Stub — will be styled in Step 4
export default function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '2rem', color: 'var(--text-muted)' }}>
      <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      {message && <p>{message}</p>}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
