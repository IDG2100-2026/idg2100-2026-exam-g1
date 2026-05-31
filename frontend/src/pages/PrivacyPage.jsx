export default function PrivacyPage() {
  return (
    <div className="container" style={styles.page}>
      <h1>Privacy Policy</h1>
      <p style={styles.updated}>Last updated: January 1, 2026</p>

      {SECTIONS.map(s => (
        <div key={s.title} className="card" style={styles.section}>
          <h2>{s.title}</h2>
          {s.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
        </div>
      ))}
    </div>
  )
}

const SECTIONS = [
  {
    title: '1. Information We Collect',
    paragraphs: [
      'When you register, we collect your username, email address, date of birth, and password (stored as a secure hash). We also collect gameplay data including game history, ELO ratings, and comments you post.',
    ],
  },
  {
    title: '2. How We Use Your Information',
    paragraphs: [
      'We use your information to operate and improve the Platform, to display your profile and game statistics, to match you with opponents, and to communicate important updates.',
      'We do not sell your personal data to third parties.',
    ],
  },
  {
    title: '3. Data Storage and Security',
    paragraphs: [
      'Your data is stored on servers located within my computer. We implement my security measures to protect your information.',
      'Despite our best efforts, no method of transmission or storage is 100% secure. We cannot guarantee absolute security.',
    ],
  },
  {
    title: '4. Cookies and Local Storage',
    paragraphs: [
      'We use browser local storage to remember your login session and appearance preferences (such as light/dark theme). No third-party tracking cookies are used.',
    ],
  },
  {
    title: '5. Your Rights',
    paragraphs: [
      'Under GDPR, you have the right to access, correct, or delete your personal data. You may update your profile information at any time from your profile page.',
      'To request deletion of your account and associated data, contact us at privacy@spanishpokerdice.com.',
    ],
  },
  {
    title: '6. Data Retention',
    paragraphs: [
      'We retain your account data for as long as your account is active. Game history may be retained for statistical purposes even after account deletion, but will be anonymized.',
    ],
  },
  {
    title: '7. Changes to This Policy',
    paragraphs: [
      'We may update this Privacy Policy from time to time. We will notify registered users of significant changes by email.',
    ],
  },
  {
    title: '8. Contact',
    paragraphs: [
      'For privacy-related questions or requests, contact our data protection officer at privacy@spanishpokerdice.com.',
    ],
  },
]

const styles = {
  page: { display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: 720 },
  updated: { color: 'var(--text-muted)', fontSize: '0.875rem' },
  section: { display: 'flex', flexDirection: 'column', gap: '0.75rem', lineHeight: 1.7 },
}
