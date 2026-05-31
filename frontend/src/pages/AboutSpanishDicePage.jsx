export default function AboutSpanishDicePage() {
  return (
    <div className="container" style={styles.page}>
      <h1>About Spanish Poker Dice</h1>

      <div className="card" style={styles.section}>
        <h2>What is Spanish Poker Dice?</h2>
        <p>
          Spanish Poker Dice is a fast-paced dice game that blends the hand-ranking logic of
          poker with the excitement of repeated rolls. Each player rolls five dice up to three
          times per round, choosing which dice to keep and which to re-roll — with the goal of
          forming the strongest possible poker hand.
        </p>
        <p>
          Unlike card poker, there is no bluffing or betting. The winner of each round is simply
          the player whose final combination of dice outranks their opponent's.
        </p>
      </div>

      <div className="card" style={styles.section}>
        <h2>The Dice</h2>
        <p>
          The game uses five standard six-sided dice. Each face represents a card rank:
          9, 10, Jack, Queen, King, and Ace.
        </p>
        <div style={styles.diceRow}>
          {['9', '10', 'J', 'Q', 'K', 'A'].map(face => (
            <div key={face} style={styles.die}>{face}</div>
          ))}
        </div>
      </div>

      <div className="card" style={styles.section}>
        <h2>Hand Rankings</h2>
        <p>Hands are ranked from highest to lowest:</p>
        <ol style={styles.list}>
          {HANDS.map(h => (
            <li key={h.name} style={styles.handItem}>
              <strong>{h.name}</strong>
              <span style={styles.handDesc}>{h.desc}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="card" style={styles.section}>
        <h2>Game Variants</h2>
        <p>
          On this platform, each game is defined by three choices:
        </p>
        <ul style={styles.variantList}>
          <li><strong>Best of 3, 5, or 7</strong> — how many rounds must be won to win the game.</li>
          <li><strong>Straights allowed or not</strong> — some variants exclude straights as a valid hand.</li>
          <li><strong>3, 10, or 30 seconds per round</strong> — controls the pace of play.</li>
        </ul>
      </div>

      <div className="card" style={styles.section}>
        <h2>How to Play</h2>
        <ol style={styles.list}>
          <li style={styles.step}>Roll all five dice to start your turn.</li>
          <li style={styles.step}>Choose which dice to keep, then re-roll the rest.</li>
          <li style={styles.step}>After your final roll, your best five-dice combination is your hand for that round.</li>
          <li style={styles.step}>The player with the higher-ranked hand wins the round.</li>
          <li style={styles.step}>Win the required number of rounds to win the game.</li>
        </ol>
      </div>
    </div>
  )
}

const HANDS = [
  { name: 'Five of a kind',  desc: 'All five dice show the same face.' },
  { name: 'Four of a kind',  desc: 'Four dice show the same face.' },
  { name: 'Full house',      desc: 'Three of a kind plus a pair.' },
  { name: 'Straight',        desc: 'Five consecutive ranks (e.g. 9-10-J-Q-K). Only valid when straights are enabled.' },
  { name: 'Three of a kind', desc: 'Three dice show the same face.' },
  { name: 'Two pair',        desc: 'Two different pairs.' },
  { name: 'One pair',        desc: 'Two dice show the same face.' },
  { name: 'High card',       desc: 'No matching dice — highest face wins.' },
]

const styles = {
  page: { display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 720 },
  section: { display: 'flex', flexDirection: 'column', gap: '0.85rem', lineHeight: 1.7 },
  diceRow: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' },
  die: {
    width: 44, height: 44,
    border: '2px solid var(--border)',
    borderRadius: 8,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: '0.9rem',
    background: 'var(--bg-surface-alt)',
    color: 'var(--text-heading)',
  },
  list: { paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  handItem: { display: 'flex', flexDirection: 'column', gap: '0.1rem' },
  handDesc: { fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 400 },
  variantList: { paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  step: { paddingLeft: '0.25rem' },
}
