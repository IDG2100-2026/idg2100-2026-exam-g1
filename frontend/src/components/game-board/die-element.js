const FACE_DATA = {
  RA: { rank: 'A', suit: '♥', red: true },
  RK: { rank: 'K', suit: '♥', red: true },
  RQ: { rank: 'Q', suit: '♥', red: true },
  RJ: { rank: 'J', suit: '♥', red: true },
  R8: { rank: '8', suit: '♥', red: true },
  R7: { rank: '7', suit: '♥', red: true },
  BA: { rank: 'A', suit: '♠', red: false },
  BK: { rank: 'K', suit: '♠', red: false },
  BQ: { rank: 'Q', suit: '♠', red: false },
  BJ: { rank: 'J', suit: '♠', red: false },
  B8: { rank: '8', suit: '♠', red: false },
  B7: { rank: '7', suit: '♠', red: false },
}

class DieElement extends HTMLElement { // https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements
  static get observedAttributes() { // https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements#responding_to_attribute_changes
    return ['value', 'held', 'disabled', 'index']
  }

  constructor() {
    super()
    this.attachShadow({ mode: 'open' }) // https://developer.mozilla.org/en-US/docs/Web/API/Element/attachShadow
    this._onClick = this._onClick.bind(this)
  }

  connectedCallback() { this.render() }
  attributeChangedCallback() { if (this.isConnected) this.render() }

  _onClick() {
    if (this.hasAttribute('disabled')) return
    this.dispatchEvent(new CustomEvent('die-hold', { // https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent
      bubbles: true,
      composed: true, // allows event to cross Shadow DOM boundary
      detail: { index: Number(this.getAttribute('index') ?? 0) },
    }))
  }

  render() {
    const face = this.getAttribute('value') ?? ''
    const held = this.hasAttribute('held')
    const disabled = this.hasAttribute('disabled')
    const data = FACE_DATA[face]

    let inner
    if (!data) {
      inner = `<span class="unknown">?</span>`
    } else {
      const color = data.red ? '#c0392b' : '#1a1a1a'
      inner = `
        <span class="corner tl" style="color:${color}">${data.rank}</span>
        <span class="suit" style="color:${color}">${data.suit}</span>
        <span class="corner br" style="color:${color}">${data.rank}</span>
      `
    }

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: inline-block; user-select: none; }
        .die {
          width: 52px; height: 52px;
          background: ${held ? '#fff8dc' : data ? '#fff' : '#555'};
          border: 2.5px solid ${held ? '#c9a800' : data ? '#ccc' : '#666'};
          box-shadow: ${held ? '0 0 0 2px #c9a800' : 'none'};
          border-radius: 8px;
          position: relative;
          cursor: ${disabled ? 'default' : 'pointer'};
          opacity: ${disabled ? 0.45 : 1};
          transition: transform 0.1s, background 0.15s, border-color 0.15s;
          box-sizing: border-box;
        }
        .die:hover { transform: ${disabled ? 'none' : 'scale(1.08)'}; }
        .corner {
          position: absolute;
          font-size: 0.65rem;
          font-weight: 800;
          line-height: 1;
        }
        .tl { top: 3px; left: 4px; }
        .br { bottom: 3px; right: 4px; transform: rotate(180deg); }
        .suit {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          font-size: 1.4rem;
          line-height: 1;
        }
        .unknown {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          font-size: 1.1rem;
          color: #aaa;
          font-weight: 700;
        }
      </style>
      <div class="die">${inner}</div>
    `
    this.shadowRoot.querySelector('.die').addEventListener('click', this._onClick)
  }
}

if (!customElements.get('die-element')) {
  customElements.define('die-element', DieElement)
}
