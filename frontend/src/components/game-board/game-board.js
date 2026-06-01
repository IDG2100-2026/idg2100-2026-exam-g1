import './player-element.js'

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

class GameBoard extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this._gameData       = null
    this._currentUserId  = ''
    this._socketState    = null
    this._listenersAttached = false
  }

  set gameData(val)      { this._gameData = val;             if (this.isConnected) this.render() }
  set currentUserId(val) { this._currentUserId = val ?? '';  if (this.isConnected) this.render() }
  set socketState(val)   { this._socketState = val;          if (this.isConnected) this.render() }

  connectedCallback() {
    this.render()
    if (!this._listenersAttached) {
      this._attachListeners()
      this._listenersAttached = true
    }
  }

  _attachListeners() {
    this.shadowRoot.addEventListener('die-hold', (e) => {
      const path = e.composedPath() 
      const playerEl = path.find(el => el.tagName === 'PLAYER-ELEMENT')
      if (!playerEl) return
      const players = [...this.shadowRoot.querySelectorAll('player-element')]
      const idx = players.indexOf(playerEl)
      const ss = this._socketState
      const gamePlayers = ss?.players ?? this._gameData?.players ?? []
      const p = gamePlayers[idx]
      const playerId = String(p?.user?._id ?? p?.user ?? '')
      this.dispatchEvent(new CustomEvent('board-die-hold', {
        bubbles: true, composed: true,
        detail: { playerId, dieIndex: e.detail.index },
      }))
    })

    this.shadowRoot.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]')
      if (!btn || btn.disabled) return
      const action = btn.dataset.action
      const detail = { action }
      if (action === 'bet' || action === 'raise') {
        const input = this.shadowRoot.querySelector('.bet-input')
        detail.amount = Number(input?.value ?? 0)
      }
      this.dispatchEvent(new CustomEvent('board-action', {
        bubbles: true, composed: true, detail,
      }))
    })
  }

  _myIndex() {
    const ss = this._socketState
    const players = ss?.players ?? this._gameData?.players ?? []
    return players.findIndex(p => String(p.user?._id ?? p.user) === String(this._currentUserId))
  }

  _usernameMap() {
    const map = {}
    ;(this._gameData?.players ?? []).forEach(p => {
      map[String(p.user?._id ?? p.user)] = p.user?.username ?? 'Player'
    })
    return map
  }

  _renderWaiting(players, game) {
    const list = players.map(p =>
      `<div class="waiting-player"><span class="dot"></span>${esc(p.user?.username ?? 'Guest')}</div>`
    ).join('')
    return `
      <div class="waiting">
        <p class="waiting-title">Waiting for players…</p>
        <p class="waiting-sub">${players.length} / ${game.maxPlayers} joined</p>
        ${list ? `<div class="waiting-players">${list}</div>` : ''}
        <p class="waiting-hint">The game starts automatically once all players have joined.</p>
      </div>`
  }

  _renderOngoing(players, game) {
    const ss = this._socketState
    if (!ss) {
      return `
        <div class="waiting">
          <p class="waiting-title">Game in progress</p>
          <p class="waiting-sub">Connecting to game events…</p>
        </div>`
    }
    if (ss.phase === 'showdown') return this._renderShowdown(game, ss)
    if (ss.phase === 'betting')  return this._renderBettingPhase(game, ss)
    return this._renderRollingPhase(game, ss)
  }

  _buildPlayerRows(ss) {
    const names = this._usernameMap()
    return (ss.players ?? []).map((sp, i) => {
      const uid   = String(sp.user?._id ?? sp.user)
      const isYou = uid === String(this._currentUserId)
      return `<player-element
        id="player-${i}"
        username="${esc(names[uid] ?? 'Player')}"
        chips="${sp.chips ?? 0}"
        bet="${sp.bet ?? 0}"
        ${isYou              ? 'is-you'      : ''}
        ${i === ss.currentPlayerIndex ? 'active-turn' : ''}
        ${sp.folded          ? 'folded'      : ''}
      ></player-element>`
    }).join('')
  }

  _renderRollingPhase(game, ss) {
    const myIdx     = this._myIndex()
    const isMyTurn  = myIdx !== -1 && myIdx === ss.currentPlayerIndex
    const names     = this._usernameMap()
    const curPlayer = ss.players?.[ss.currentPlayerIndex]
    const curName   = names[String(curPlayer?.user?._id ?? curPlayer?.user)] ?? 'player'

    const actions = isMyTurn ? `
      <div class="actions">
        <button class="btn-action btn-primary" data-action="roll" ${ss.rollsUsed >= 3 ? 'disabled' : ''}>
          Roll${ss.rollsUsed > 0 ? ` (${ss.rollsUsed}/3)` : ''}
        </button>
        ${ss.rollsUsed > 0 ? `<button class="btn-action" data-action="doneRolling">Done Rolling</button>` : ''}
      </div>` : `<p class="turn-info">Waiting for ${esc(curName)} to roll…</p>`

    return `
      <p class="round-info">
        Round <strong>${ss.currentRound ?? 1}</strong> of <strong>${game.rounds}</strong>
        &nbsp;·&nbsp; ${game.variant === 'straights' ? 'Straights' : 'No straights'}
        &nbsp;·&nbsp; ${game.timeControl}s &nbsp;·&nbsp; Rolling
      </p>
      <div class="players">${this._buildPlayerRows(ss)}</div>
      ${actions}`
  }

  _renderBettingPhase(game, ss) {
    const myIdx    = this._myIndex()
    const isMyTurn = myIdx !== -1 && myIdx === ss.currentPlayerIndex
    const myPlayer = ss.players?.[myIdx]
    const amFolded = myPlayer?.folded ?? false
    const names    = this._usernameMap()
    const curPlayer = ss.players?.[ss.currentPlayerIndex]
    const curName   = names[String(curPlayer?.user?._id ?? curPlayer?.user)] ?? 'player'

    let actions = ''
    if (isMyTurn && !amFolded) {
      if (!ss.currentBet) {
        actions = `
          <div class="actions">
            <button class="btn-action" data-action="check">Check</button>
            <div class="bet-row">
              <input type="number" class="bet-input" min="1" max="${myPlayer?.chips ?? 9999}" value="1" />
              <button class="btn-action btn-primary" data-action="bet">Bet</button>
            </div>
          </div>`
      } else {
        actions = `
          <div class="actions">
            <button class="btn-action btn-primary" data-action="call">Call (${ss.currentBet} pts)</button>
            <div class="bet-row">
              <input type="number" class="bet-input" min="${ss.currentBet * 2}" max="${myPlayer?.chips ?? 9999}" value="${ss.currentBet * 2}" />
              <button class="btn-action" data-action="raise">Raise</button>
            </div>
            <button class="btn-action btn-danger" data-action="fold">Fold</button>
          </div>`
      }
    } else if (!amFolded) {
      actions = `<p class="turn-info">Waiting for ${esc(curName)} to act…</p>`
    }

    return `
      <p class="round-info">
        Round <strong>${ss.currentRound ?? 1}</strong> of <strong>${game.rounds}</strong>
        &nbsp;·&nbsp; Betting
      </p>
      <p class="pot-info">Pot: <strong>${ss.pot ?? 0}</strong> pts${ss.currentBet ? ` · Bet: <strong>${ss.currentBet}</strong> pts` : ''}</p>
      <div class="players">${this._buildPlayerRows(ss)}</div>
      ${actions}`
  }

  _renderShowdown(game, ss) {
    const names  = this._usernameMap()
    const result = ss.roundResult ?? {}
    const winnerUid = result.winner ? String(result.winner?._id ?? result.winner) : null
    const winnerName = winnerUid ? (names[winnerUid] ?? 'Unknown') : null

    const rows = (result.players ?? []).map(rp => {
      const uid  = String(rp.user?._id ?? rp.user)
      const name = names[uid] ?? 'Player'
      const isYou = uid === String(this._currentUserId)
      const dice = (rp.dice ?? []).map(d => `<die-element value="${esc(d)}" disabled></die-element>`).join('')
      return `
        <div class="sd-player ${rp.folded ? 'folded' : ''}">
          <div class="sd-header">
            <span class="sd-name">${esc(name)}${isYou ? ' (You)' : ''}</span>
            <span class="sd-hand">${esc(rp.hand?.handLabel ?? '')}</span>
            ${rp.folded ? '<span class="sd-fold">Folded</span>' : ''}
          </div>
          <div class="sd-dice">${dice}</div>
          <p class="sd-chips">${rp.chips ?? 0} pts remaining</p>
        </div>`
    }).join('')

    return `
      <div class="showdown">
        <p class="sd-title">${result.isTie ? 'Draw!' : winnerName ? `${esc(winnerName)} wins!` : 'Round Over'}</p>
        ${rows}
        <p class="sd-hint">Next round starting…</p>
      </div>`
  }

  _renderFinished(players, game) {
    const winnerId = String(game.winner?._id ?? game.winner ?? '')
    const names    = this._usernameMap()
    const winnerName = names[winnerId] ?? game.winner?.username ?? 'Unknown'

    const ssPlayers = this._socketState?.roundResult?.players
    const scores = (ssPlayers ?? players).map(p => {
      const uid  = String(p.user?._id ?? p.user)
      return `<div class="score-row">
        <span>${esc(names[uid] ?? 'Player')}</span>
        <span>${p.chips ?? p.points ?? 0} pts</span>
      </div>`
    }).join('')

    return `
      <div class="finished">
        <p class="finished-title">Game Over</p>
        <p class="finished-winner">Winner: <strong>${esc(winnerName)}</strong></p>
        <div class="final-scores">${scores}</div>
      </div>`
  }

  _setPlayerProps() {
    const ss = this._socketState
    if (!ss) return
    this.shadowRoot.querySelectorAll('player-element').forEach((el, i) => {
      const sp  = ss.players?.[i]
      if (!sp) return
      const uid   = String(sp.user?._id ?? sp.user)
      const isYou = uid === String(this._currentUserId)
      if (isYou && ss.myDice) {
        el.dice = ss.myDice.map((face, idx) => ({ value: face, held: ss.myHeld?.[idx] ?? false }))
      } else {
        el.dice = Array(5).fill({ value: '', held: false })
      }
      el.canInteract = isYou && ss.phase === 'rolling' && i === ss.currentPlayerIndex
    })
  }

  render() {
    const game = this._gameData
    if (!game) { this.shadowRoot.innerHTML = `<style>:host{display:block}</style>`; return }

    const players = game.players ?? []
    const status  = game.status ?? 'waiting'

    let content = ''
    if (status === 'waiting')      content = this._renderWaiting(players, game)
    else if (status === 'ongoing') content = this._renderOngoing(players, game)
    else                           content = this._renderFinished(players, game)

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; width: 100%; }
        .board {
          background: var(--board-color, #1a5276);
          border-radius: 12px; padding: 1.25rem;
          min-height: 340px; display: flex;
          flex-direction: column; gap: 1rem; box-sizing: border-box;
        }
        /* Waiting */
        .waiting { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:.75rem; flex:1; text-align:center; }
        .waiting-title { color:#fff; font-size:1.3rem; font-weight:700; margin:0; }
        .waiting-sub   { color:rgba(255,255,255,.7); font-size:.9rem; margin:0; }
        .waiting-players { display:flex; gap:.5rem; flex-wrap:wrap; justify-content:center; }
        .waiting-player  { display:flex; align-items:center; gap:.4rem; background:rgba(255,255,255,.12); border-radius:20px; padding:.3rem .75rem; color:#fff; font-size:.85rem; }
        .dot  { width:8px; height:8px; background:#4caf50; border-radius:50%; display:inline-block; }
        .waiting-hint { color:rgba(255,255,255,.4); font-size:.8rem; margin:0; }
        /* Info bars */
        .round-info { color:rgba(255,255,255,.75); font-size:.85rem; text-align:center; margin:0; }
        .round-info strong { color:#fff; }
        .pot-info { color:rgba(255,255,255,.8); font-size:.9rem; text-align:center; margin:0; }
        .pot-info strong { color:#e8c84a; }
        /* Players */
        .players { display:flex; flex-direction:column; gap:.75rem; }
        /* Actions */
        .actions { display:flex; gap:.5rem; flex-wrap:wrap; justify-content:center; align-items:center; margin-top:.25rem; }
        .bet-row { display:flex; gap:.4rem; align-items:center; }
        .bet-input {
          width:80px; padding:.4rem .5rem; border-radius:6px;
          border:1px solid rgba(255,255,255,.3); background:rgba(255,255,255,.1);
          color:#fff; font-size:.85rem;
        }
        .bet-input:focus { outline:none; border-color:var(--accent,#4a90e2); }
        .btn-action {
          padding:.5rem 1.1rem; border:none; border-radius:6px;
          font-size:.875rem; font-weight:600; cursor:pointer;
          background:rgba(255,255,255,.15); color:#fff; transition:background .15s;
        }
        .btn-action:disabled { opacity:.4; cursor:default; }
        .btn-action:not(:disabled):hover { background:rgba(255,255,255,.27); }
        .btn-primary { background:var(--accent,#4a90e2)!important; }
        .btn-primary:not(:disabled):hover { background:#3a7bd5!important; }
        .btn-danger  { background:rgba(200,40,40,.75)!important; }
        .btn-danger:not(:disabled):hover  { background:rgba(200,40,40,.95)!important; }
        .turn-info { text-align:center; color:rgba(255,255,255,.6); font-size:.875rem; margin:0; }
        /* Showdown */
        .showdown { display:flex; flex-direction:column; gap:.75rem; }
        .sd-title { color:#e8c84a; font-size:1.3rem; font-weight:700; text-align:center; margin:0; }
        .sd-player { background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.15); border-radius:10px; padding:.75rem 1rem; }
        .sd-player.folded { opacity:.5; }
        .sd-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:.5rem; flex-wrap:wrap; gap:.4rem; }
        .sd-name  { color:#eee; font-weight:700; font-size:.9rem; }
        .sd-hand  { color:#4caf50; font-size:.8rem; font-weight:600; }
        .sd-fold  { color:rgba(200,40,40,.9); font-size:.8rem; font-weight:600; }
        .sd-dice  { display:flex; gap:6px; flex-wrap:wrap; }
        .sd-chips { font-size:.75rem; color:rgba(255,255,255,.5); margin:.4rem 0 0; }
        .sd-hint  { text-align:center; color:rgba(255,255,255,.35); font-size:.8rem; margin:0; }
        /* Finished */
        .finished { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:1rem; flex:1; text-align:center; }
        .finished-title  { color:#fff; font-size:1.4rem; font-weight:700; margin:0; }
        .finished-winner { color:rgba(255,255,255,.85); font-size:1rem; margin:0; }
        .finished-winner strong { color:#e8c84a; }
        .final-scores { display:flex; flex-direction:column; gap:.4rem; width:100%; max-width:240px; }
        .score-row { display:flex; justify-content:space-between; background:rgba(255,255,255,.08); border-radius:6px; padding:.4rem .75rem; color:rgba(255,255,255,.8); font-size:.85rem; }
      </style>
      <div class="board">${content}</div>
    `

    const ss = this._socketState
    if (status === 'ongoing' && ss && ss.phase !== 'showdown') {
      this._setPlayerProps()
    }
  }
}

if (!customElements.get('game-board')) {
  customElements.define('game-board', GameBoard)
}
