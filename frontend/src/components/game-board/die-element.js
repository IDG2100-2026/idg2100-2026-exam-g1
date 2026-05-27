// Sources:
// - Custom Elements: https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements
// - Shadow DOM: https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM
// - CustomEvent: https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent

// Grid positions (row, col) for each die face value in a 3x3 pip grid
const PIP_POSITIONS = {
  1: [[1, 1]],
  2: [[0, 2], [2, 0]],
  3: [[0, 2], [1, 1], [2, 0]],
  4: [[0, 0], [0, 2], [2, 0], [2, 2]],
  5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
}

class DieElement extends HTMLElement {
  static get observedAttributes() {
    return ['value', 'held', 'disabled', 'index']
  }

  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this._onClick = this._onClick.bind(this)
  }

  connectedCallback() {
    this.render()
  }

  attributeChangedCallback() {
    if (this.isConnected) this.render()
  }

  _onClick() {
    if (this.hasAttribute('disabled')) return
    this.dispatchEvent(new CustomEvent('die-hold', {
      bubbles: true,
      composed: true,
      detail: { index: Number(this.getAttribute('index') ?? 0) },
    }))
  }

  render() {
    const value = Number(this.getAttribute('value')) || 0
    const held = this.hasAttribute('held')
    const disabled = this.hasAttribute('disabled')
    const positions = PIP_POSITIONS[value] ?? []

    const cells = Array.from({ length: 9 }, (_, i) => {
      const row = Math.floor(i / 3)
      const col = i % 3
      if (value === 0) {
        return i === 4
          ? `<div class="cell"><span class="unknown">?</span></div>`
          : `<div class="cell"></div>`
      }
      const active = positions.some(([r, c]) => r === row && c === col)
      return `<div class="cell">${active ? '<div class="pip"></div>' : ''}</div>`
    }).join('')

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: inline-block; user-select: none; }
        .die {
          width: 54px;
          height: 54px;
          background: ${held ? '#e8c84a' : value === 0 ? '#555' : '#f5f5f5'};
          border: 2.5px solid ${held ? '#c9a800' : value === 0 ? '#666' : '#ccc'};
          border-radius: 10px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          padding: 5px;
          gap: 2px;
          cursor: ${disabled ? 'default' : 'pointer'};
          opacity: ${disabled ? '0.45' : '1'};
          transition: transform 0.1s ease, background 0.15s, border-color 0.15s;
          box-sizing: border-box;
        }
        .die:hover { transform: ${disabled ? 'none' : 'scale(1.08)'}; }
        .cell { display: flex; align-items: center; justify-content: center; }
        .pip { width: 9px; height: 9px; background: #1a1a1a; border-radius: 50%; display: block; }
        .unknown { font-size: 1rem; color: #aaa; font-weight: 700; line-height: 1; }
      </style>
      <div class="die">${cells}</div>
    `
    this.shadowRoot.querySelector('.die').addEventListener('click', this._onClick)
  }
}

if (!customElements.get('die-element')) {
  customElements.define('die-element', DieElement)
}
