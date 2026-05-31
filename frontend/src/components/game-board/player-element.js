import './die-element.js'

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

class PlayerElement extends HTMLElement { // https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements
  static get observedAttributes() { // https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements#responding_to_attribute_changes
    return ['username', 'chips', 'bet', 'is-you', 'folded', 'active-turn']
  }

  constructor() {
    super()
    this.attachShadow({ mode: 'open' }) // https://developer.mozilla.org/en-US/docs/Web/API/Element/attachShadow
    this._dice = Array(5).fill({ value: '', held: false })
    this._canInteract = false
  }

  set dice(val) {
    this._dice = Array.isArray(val) ? val : Array(5).fill({ value: '', held: false })
    if (this.isConnected) this.render()
  }

  set canInteract(val) {
    this._canInteract = !!val
    if (this.isConnected) this.render()
  }

  connectedCallback() { this.render() }
  attributeChangedCallback() { if (this.isConnected) this.render() }

  render() {
    const username   = esc(this.getAttribute('username') ?? 'Player')
    const chips      = esc(this.getAttribute('chips') ?? '0')
    const bet        = Number(this.getAttribute('bet') ?? 0)
    const isYou      = this.hasAttribute('is-you')
    const folded     = this.hasAttribute('folded')
    const activeTurn = this.hasAttribute('active-turn')
    const canInteract = this._canInteract && !folded

    const diceHtml = this._dice.map((d, i) =>
      `<die-element
        index="${i}"
        value="${esc(d.value ?? '')}"
        ${d.held ? 'held' : ''}
        ${!canInteract ? 'disabled' : ''}
      ></die-element>`
    ).join('')

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        .player {
          background: rgba(255,255,255,0.06);
          border: 1.5px solid ${activeTurn ? '#4a90e2' : folded ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.15)'};
          border-radius: 10px;
          padding: 0.75rem 1rem;
          opacity: ${folded ? 0.5 : 1};
          transition: border-color 0.2s, opacity 0.2s;
        }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; gap: 0.5rem; }
        .name-row { display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; }
        .name { font-weight: 700; font-size: 0.9rem; color: #eee; }
        .badge { font-size: 0.68rem; border-radius: 4px; padding: 1px 6px; font-weight: 600; }
        .you-badge  { background: #4a90e2; color: #fff; }
        .turn-badge { background: #4caf50; color: #fff; }
        .fold-badge { background: rgba(200,40,40,0.85); color: #fff; }
        .chips { font-size: 0.8rem; color: rgba(255,255,255,0.55); white-space: nowrap; }
        .bet-line { font-size: 0.75rem; color: #e8c84a; margin: 0 0 0.4rem; }
        .dice { display: flex; gap: 6px; flex-wrap: wrap; }
        .hint { font-size: 0.72rem; color: rgba(255,255,255,0.35); margin: 0.35rem 0 0; }
      </style>
      <div class="player">
        <div class="header">
          <div class="name-row">
            <span class="name">${username}</span>
            ${isYou      ? '<span class="badge you-badge">You</span>'    : ''}
            ${activeTurn ? '<span class="badge turn-badge">Turn</span>'  : ''}
            ${folded     ? '<span class="badge fold-badge">Folded</span>': ''}
          </div>
          <span class="chips">${chips} pts</span>
        </div>
        ${bet > 0 ? `<p class="bet-line">Bet: ${bet} pts</p>` : ''}
        <div class="dice">${diceHtml}</div>
        ${canInteract ? '<p class="hint">Click a die to hold it</p>' : ''}
      </div>
    `
  }
}

if (!customElements.get('player-element')) {
  customElements.define('player-element', PlayerElement)
}
