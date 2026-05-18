// Sources:
// - Array.prototype.map (rendering sections): https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map

export default function TermsPage() {
  return (
    <div className="container" style={styles.page}>
      <h1>Terms and Conditions</h1>
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
    title: '1. Acceptance of Terms',
    paragraphs: [
      'By accessing or using Spanish Poker Dice platform, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use the Platform.',
      'We reserve the right to update these terms at any time. Continued use of the Platform after changes constitutes acceptance of the revised terms.',
    ],
  },
  {
    title: '2. Eligibility',
    paragraphs: [
      'You must be at least 16 years of age to register for an account on the Platform. By creating an account, you confirm that you meet this requirement.',
      'The Platform is intended for personal, non-commercial use only.',
    ],
  },
  {
    title: '3. User Accounts',
    paragraphs: [
      'You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account.',
      'Each user may register only one account. Duplicate accounts may be removed without notice.',
      'We reserve the right to suspend or terminate accounts that violate these terms.',
    ],
  },
  {
    title: '4. Acceptable Use',
    paragraphs: [
      'You agree not to use the Platform to harass, abuse, or harm other users; to cheat or exploit bugs; to transmit spam or malicious code; or to attempt unauthorized access to our systems.',
      'Violations may result in immediate account termination.',
    ],
  },
  {
    title: '5. Intellectual Property',
    paragraphs: [
      'All content on the Platform, including but not limited to graphics, logos, and software, is the property of Spanish Poker Dice and protected by applicable intellectual property laws.',
      'You may not reproduce, distribute, or create derivative works without our written permission.',
    ],
  },
  {
    title: '6. Disclaimer of Warranties',
    paragraphs: [
      'The Platform is provided "as is" without warranties of any kind, either express or implied. We do not guarantee uninterrupted or error-free operation.',
    ],
  },
  {
    title: '7. Limitation of Liability',
    paragraphs: [
      'To the fullest extent permitted by law, Spanish Poker Dice shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Platform.',
    ],
  },
  {
    title: '8. Contact',
    paragraphs: [
      'For questions about these Terms, please contact us at legal@spanishpokerdice.com.',
    ],
  },
]

const styles = {
  page: { display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: 720 },
  updated: { color: 'var(--text-muted)', fontSize: '0.875rem' },
  section: { display: 'flex', flexDirection: 'column', gap: '0.75rem', lineHeight: 1.7 },
}
