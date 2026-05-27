// Sources:
// - Custom Elements: https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements
// - Shadow DOM: https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM
// - CSS custom properties in Shadow DOM: https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties

import './die-element.js'

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

class PlayerElement extends HTMLElement {
  static get observedAttributes() {
    return ['username', 'points', 'active', 'is-you']
  }

  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this._dice = Array(5).fill({ value: 0, held: false })
    this._canInteract = false
  }

  // Complex data is passed as properties (not attributes) since attributes are strings only
  set dice(val) {
    this._dice = Array.isArray(val) ? val : Array(5).fill({ value: 0, held: false })
    if (this.isConnected) this.render()
  }

  set canInteract(val) {
    this._canInteract = !!val
    if (this.isConnected) this.render()
  }

  connectedCallback() { this.render() }
  attributeChangedCallback() { if (this.isConnected) this.render() }

  render() {
    const username = esc(this.getAttribute('username') ?? 'Player')
    const points = esc(this.getAttribute('points') ?? '0')
    const active = this.hasAttribute('active')
    const isYou = this.hasAttribute('is-you')
    const canInteract = this._canInteract

    const diceHtml = this._dice.map((d, i) =>
      `<die-element
        index="${i}"
        value="${d.value ?? 0}"
        ${d.held ? 'held' : ''}
        ${!canInteract ? 'disabled' : ''}
      ></die-element>`
    ).join('')

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        .player {
          background: var(--bg-surface, #1e1e1e);
          border: 1.5px solid ${active ? 'var(--accent, #4a90e2)' : 'var(--border, #444)'};
          border-radius: 10px;
          padding: 0.75rem 1rem;
          transition: border-color 0.2s;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.6rem;
          gap: 0.5rem;
        }
        .name-row { display: flex; align-items: center; gap: 0.4rem; }
        .name { font-weight: 700; font-size: 0.9rem; color: var(--text, #eee); }
        .you-badge {
          font-size: 0.68rem;
          background: var(--accent, #4a90e2);
          color: #fff;
          border-radius: 4px;
          padding: 1px 6px;
        }
        .points { font-size: 0.8rem; color: var(--text-muted, #999); white-space: nowrap; }
        .dice { display: flex; gap: 6px; flex-wrap: wrap; }
        .hint {
          font-size: 0.72rem;
          color: var(--text-muted, #888);
          margin: 0.4rem 0 0;
        }
      </style>
      <div class="player">
        <div class="header">
          <div class="name-row">
            <span class="name">${username}</span>
            ${isYou ? '<span class="you-badge">You</span>' : ''}
          </div>
          <span class="points">${points} pts</span>
        </div>
        <div class="dice">${diceHtml}</div>
        ${canInteract ? '<p class="hint">Click a die to hold it before re-rolling</p>' : ''}
      </div>
    `
  }
}

if (!customElements.get('player-element')) {
  customElements.define('player-element', PlayerElement)
}
