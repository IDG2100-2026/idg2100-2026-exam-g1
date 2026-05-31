export default function ErrorMessage({ message }) {
  if (!message) return null
  return (
    <div style={{ color: 'var(--error)', background: 'var(--error-light)', border: '1px solid var(--error)', borderRadius: 'var(--radius)', padding: '0.75rem 1rem', marginBottom: '1rem' }}>
      {message}
    </div>
  )
}
