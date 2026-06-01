import imgRA from '../../assets/RA.png'
import imgRK from '../../assets/RK.png'
import imgRQ from '../../assets/RQ.png'
import imgRJ from '../../assets/RJ.png'
import imgR8 from '../../assets/R8.png'
import imgR7 from '../../assets/R7.png'
import imgBA from '../../assets/BA.png'
import imgBK from '../../assets/BK.png'
import imgBQ from '../../assets/BQ.png'
import imgBJ from '../../assets/BJ.png'
import imgB8 from '../../assets/B8.png'
import imgB7 from '../../assets/B7.png'

const IMAGES = { RA: imgRA, RK: imgRK, RQ: imgRQ, RJ: imgRJ, R8: imgR8, R7: imgR7, BA: imgBA, BK: imgBK, BQ: imgBQ, BJ: imgBJ, B8: imgB8, B7: imgB7 }

class DieElement extends HTMLElement {
  static get observedAttributes() {
    return ['value', 'held', 'disabled', 'index']
  }

  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this._onClick = this._onClick.bind(this)
  }

  connectedCallback() { this.render() }
  attributeChangedCallback() { if (this.isConnected) this.render() }

  _onClick() {
    if (this.hasAttribute('disabled')) return
    this.dispatchEvent(new CustomEvent('die-hold', {
      bubbles: true,
      composed: true,
      detail: { index: Number(this.getAttribute('index') ?? 0) },
    }))
  }

  render() {
    const face = this.getAttribute('value') ?? ''
    const held = this.hasAttribute('held')
    const disabled = this.hasAttribute('disabled')
    const img = IMAGES[face]

    const inner = img
      ? `<img src="${img}" alt="${face}" draggable="false" />`
      : `<span class="unknown">?</span>`

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: inline-block; user-select: none; }
        .die {
          width: 64px; height: 64px;
          background: ${held ? '#fff8dc' : img ? '#fff' : '#555'};
          border: 2.5px solid ${held ? '#c9a800' : img ? '#ccc' : '#666'};
          box-shadow: ${held ? '0 0 0 2px #c9a800' : 'none'};
          border-radius: 8px;
          position: relative;
          cursor: ${disabled ? 'default' : 'pointer'};
          opacity: ${disabled ? 0.45 : 1};
          transition: transform 0.1s, box-shadow 0.15s, border-color 0.15s;
          box-sizing: border-box;
          overflow: hidden;
          display: flex; align-items: center; justify-content: center;
        }
        .die:hover { transform: ${disabled ? 'none' : 'scale(1.08)'}; }
        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          border-radius: 5px;
        }
        .unknown {
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
