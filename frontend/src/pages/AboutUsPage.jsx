export default function AboutUsPage() {
  return (
    <div className="container" style={styles.page}>
      <h1>About Us</h1>

      <div className="card" style={styles.section}>
        <h2>Our Story</h2>
        <p>
          Spanish Poker Dice was founded in 2025 by a small group of students who grew up
          playing the game as kids. What started as a small group project
          turned into a fully-fledged platform after students
          and strangers alike kept asking for access.
        </p>
        <p>
          We launched our first public beta in early 2026 with just three game variants and
          a handful of players. Within months, the community had grown across Europe and beyond.
        </p>
      </div>

      <div className="card" style={styles.section}>
        <h2>Our Mission</h2>
        <p>
          We believe great games should be accessible to everyone. Our mission is to preserve
          and promote the tradition of Spanish Poker Dice and compete in organized tournaments — no matter where you are.
        </p>
      </div>

      <div className="card" style={styles.section}>
        <h2>The Team</h2>
        <div style={styles.teamGrid}>
          {TEAM.map(member => (
            <div key={member.name} style={styles.member}>
              <div style={styles.memberAvatar}>{member.name[0]}</div>
              <div>
                <p style={styles.memberName}>{member.name}</p>
                <p style={styles.memberRole}>{member.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={styles.section}>
        <h2>Contact</h2>
        <p>
          Have questions, feedback, or just want to say hello? Reach us at{' '}
          <a href="mailto:pokerdice@outlook.com">pokerdice@outlook.com</a>.
        </p>
      </div>
    </div>
  )
}

const TEAM = [
  { name: 'Stian Gabrielsen', role: 'Frontend Developer' },
  { name: 'Jørgen Halsa', role: 'Backend Developer' },
]

const styles = {
  page: { display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 720 },
  section: { display: 'flex', flexDirection: 'column', gap: '0.85rem', lineHeight: 1.7 },
  teamGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' },
  member: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  memberAvatar: {
    width: 40, height: 40, borderRadius: '50%',
    background: 'var(--accent)', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: '1rem', flexShrink: 0,
  },
  memberName: { fontWeight: 600, fontSize: '0.9rem' },
  memberRole: { fontSize: '0.8rem', color: 'var(--text-muted)' },
}
