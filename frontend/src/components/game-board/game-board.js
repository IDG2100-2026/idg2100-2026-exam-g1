// Sources:
// - Custom Elements: https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements
// - Shadow DOM: https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM
// - Event.composedPath: https://developer.mozilla.org/en-US/docs/Web/API/Event/composedPath
// - CSS custom properties: https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties

import './player-element.js'

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

class GameBoard extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this._gameData = null
    this._currentUserId = ''
    this._diceState = {}
    this._listenersAttached = false
  }

  set gameData(val) {
    this._gameData = val
    if (this.isConnected) this.render()
  }

  set currentUserId(val) {
    this._currentUserId = val ?? ''
    if (this.isConnected) this.render()
  }

  // diceState: { [userId]: [{ value, held }, ...] }
  set diceState(val) {
    this._diceState = val ?? {}
    if (this.isConnected) this.render()
  }

  connectedCallback() {
    this.render()
    if (!this._listenersAttached) {
      this._attachListeners()
      this._listenersAttached = true
    }
  }

  // Event delegation on shadow root — persists across re-renders since listeners are on the root
  _attachListeners() {
    // die-hold bubbles up from die-element through player-element into this shadow root (composed: true)
    this.shadowRoot.addEventListener('die-hold', (e) => {
      const path = e.composedPath()
      const playerEl = path.find(el => el.tagName === 'PLAYER-ELEMENT')
      if (!playerEl) return
      const players = [...this.shadowRoot.querySelectorAll('player-element')]
      const playerIndex = players.indexOf(playerEl)
      const playerId = this._gameData?.players?.[playerIndex]?.user?._id ?? ''
      this.dispatchEvent(new CustomEvent('board-die-hold', {
        bubbles: true,
        composed: true,
        detail: { playerId, dieIndex: e.detail.index },
      }))
    })

    // Action buttons (Roll, Bet, Match, Fold) use event delegation via data-action
    this.shadowRoot.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]')
      if (!btn) return
      this.dispatchEvent(new CustomEvent('board-action', {
        bubbles: true,
        composed: true,
        detail: { action: btn.dataset.action },
      }))
    })
  }

  _renderWaiting(players, game) {
    const playerList = players.map(p =>
      `<div class="waiting-player">
        <span class="dot"></span>
        ${esc(p.user?.username ?? 'Guest')}
      </div>`
    ).join('')

    return `
      <div class="waiting">
        <p class="waiting-title">Waiting for players…</p>
        <p class="waiting-sub">${players.length} / ${game.maxPlayers} joined</p>
        ${playerList ? `<div class="waiting-players">${playerList}</div>` : ''}
        <p class="waiting-hint">The game starts automatically once all players have joined.</p>
      </div>
    `
  }

  _renderOngoing(players, game) {
    const isInGame = players.some(p => {
      const uid = p.user?._id ?? p.user
      return uid === this._currentUserId
    })

    const playersHtml = players.map((p, i) => {
      const userId = p.user?._id ?? ''
      const isYou = userId === this._currentUserId
      return `<player-element
        id="player-${i}"
        username="${esc(p.user?.username ?? 'Guest')}"
        points="${esc(String(p.points ?? 0))}"
        ${isYou ? 'is-you' : ''}
      ></player-element>`
    }).join('')

    return `
      <p class="round-info">
        Round <strong>1</strong> of <strong>${game.rounds}</strong>
        &nbsp;·&nbsp; ${game.variant === 'straights' ? 'Straights' : 'No straights'}
        &nbsp;·&nbsp; ${game.timeControl}s
      </p>
      <div class="players">${playersHtml}</div>
      ${isInGame ? `
        <div class="actions">
          <button class="btn-action btn-primary" data-action="roll">Roll</button>
          <button class="btn-action" data-action="bet">Bet</button>
          <button class="btn-action" data-action="match">Match</button>
          <button class="btn-action btn-danger" data-action="fold">Fold</button>
        </div>
        <p class="actions-hint">Game mechanics wire up once WebSocket dice events are ready</p>
      ` : ''}
    `
  }

  _renderFinished(players, game) {
    const winnerId = game.winner?._id ?? game.winner
    const winnerPlayer = players.find(p => {
      const uid = p.user?._id ?? p.user
      return uid === winnerId
    })
    const winnerName = esc(winnerPlayer?.user?.username ?? game.winner?.username ?? 'Unknown')

    const scores = players.map(p =>
      `<div class="score-row">
        <span>${esc(p.user?.username ?? 'Guest')}</span>
        <span>${p.points ?? 0} pts</span>
      </div>`
    ).join('')

    return `
      <div class="finished">
        <p class="finished-title">Game Over</p>
        <p class="finished-winner">Winner: <strong>${winnerName}</strong></p>
        <div class="final-scores">${scores}</div>
      </div>
    `
  }

  render() {
    const game = this._gameData
    if (!game) {
      this.shadowRoot.innerHTML = `<style>:host { display: block; }</style>`
      return
    }

    const players = game.players ?? []
    const status = game.status ?? 'waiting'

    let content = ''
    if (status === 'waiting')       content = this._renderWaiting(players, game)
    else if (status === 'ongoing')  content = this._renderOngoing(players, game)
    else                            content = this._renderFinished(players, game)

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; width: 100%; }

        .board {
          background: var(--board-color, #1a5276);
          border-radius: 12px;
          padding: 1.25rem;
          min-height: 340px;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          box-sizing: border-box;
        }

        /* ── Waiting ── */
        .waiting {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          flex: 1;
          text-align: center;
        }
        .waiting-title { color: #fff; font-size: 1.3rem; font-weight: 700; margin: 0; }
        .waiting-sub   { color: rgba(255,255,255,0.7); font-size: 0.9rem; margin: 0; }
        .waiting-players { display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: center; }
        .waiting-player {
          display: flex; align-items: center; gap: 0.4rem;
          background: rgba(255,255,255,0.12);
          border-radius: 20px;
          padding: 0.3rem 0.75rem;
          color: #fff; font-size: 0.85rem;
        }
        .dot { width: 8px; height: 8px; background: #4caf50; border-radius: 50%; display: inline-block; }
        .waiting-hint { color: rgba(255,255,255,0.4); font-size: 0.8rem; margin: 0; }

        /* ── Ongoing ── */
        .round-info {
          color: rgba(255,255,255,0.75);
          font-size: 0.85rem;
          text-align: center;
          margin: 0;
        }
        .round-info strong { color: #fff; }
        .players { display: flex; flex-direction: column; gap: 0.75rem; }
        .actions {
          display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: center;
          margin-top: 0.25rem;
        }
        .btn-action {
          padding: 0.5rem 1.25rem;
          border: none; border-radius: 6px;
          font-size: 0.9rem; font-weight: 600;
          cursor: pointer;
          background: rgba(255,255,255,0.15);
          color: #fff;
          transition: background 0.15s;
        }
        .btn-action:hover       { background: rgba(255,255,255,0.27); }
        .btn-primary            { background: var(--accent, #4a90e2) !important; }
        .btn-primary:hover      { background: #3a7bd5 !important; }
        .btn-danger             { background: rgba(200,40,40,0.75) !important; }
        .btn-danger:hover       { background: rgba(200,40,40,0.95) !important; }
        .actions-hint {
          text-align: center;
          color: rgba(255,255,255,0.3);
          font-size: 0.75rem;
          margin: 0;
        }

        /* ── Finished ── */
        .finished {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 1rem; flex: 1; text-align: center;
        }
        .finished-title  { color: #fff; font-size: 1.4rem; font-weight: 700; margin: 0; }
        .finished-winner { color: rgba(255,255,255,0.85); font-size: 1rem; margin: 0; }
        .finished-winner strong { color: #e8c84a; }
        .final-scores {
          display: flex; flex-direction: column; gap: 0.4rem;
          width: 100%; max-width: 240px;
        }
        .score-row {
          display: flex; justify-content: space-between;
          background: rgba(255,255,255,0.08);
          border-radius: 6px;
          padding: 0.4rem 0.75rem;
          color: rgba(255,255,255,0.8); font-size: 0.85rem;
        }
      </style>
      <div class="board">${content}</div>
    `

    // Set array/boolean properties on player-elements after innerHTML (can't be done via attributes)
    if (status === 'ongoing') {
      this.shadowRoot.querySelectorAll('player-element').forEach((el, i) => {
        const p = players[i]
        const userId = p?.user?._id ?? ''
        const isYou = userId === this._currentUserId
        el.dice = this._diceState[userId] ?? Array(5).fill({ value: 0, held: false })
        el.canInteract = isYou
      })
    }
  }
}

if (!customElements.get('game-board')) {
  customElements.define('game-board', GameBoard)
}
