// Sources:
// - React useRef: https://react.dev/reference/react/useRef
// - React useEffect: https://react.dev/reference/react/useEffect
// - React useState: https://react.dev/reference/react/useState
// - Web Components in React (ref + property passing): https://react.dev/learn/escape-hatches

import { useRef, useEffect, useState } from 'react'
import './game-board.js' // registers game-board → player-element → die-element

// React wrapper around the <game-board> Web Component.
// Complex data (arrays, objects) must be passed via DOM properties since HTML attributes are strings only.
export default function GameBoard({ game, currentUser, onAction }) {
  const boardRef = useRef(null)

  // Local dice state per player: { [userId]: [{ value, held }, ...] }
  // Populated by die-hold toggle events; will be replaced by WebSocket roll data when ready
  const [diceState, setDiceState] = useState({})

  // Push data into the Web Component whenever game, user, or dice state changes
  useEffect(() => {
    const el = boardRef.current
    if (!el || !game) return
    el.gameData = game
    el.currentUserId = currentUser?._id ?? ''
    el.diceState = diceState
  }, [game, currentUser, diceState])

  // Wire up custom events from the board
  useEffect(() => {
    const el = boardRef.current
    if (!el) return

    function handleDieHold(e) {
      const { playerId, dieIndex } = e.detail
      // Only the current user can hold their own dice
      if (playerId !== currentUser?._id) return
      setDiceState(prev => {
        const dice = prev[playerId] ?? Array(5).fill({ value: 0, held: false })
        return {
          ...prev,
          [playerId]: dice.map((d, i) => i === dieIndex ? { ...d, held: !d.held } : d),
        }
      })
    }

    function handleAction(e) {
      onAction?.(e.detail.action)
    }

    el.addEventListener('board-die-hold', handleDieHold)
    el.addEventListener('board-action', handleAction)
    return () => {
      el.removeEventListener('board-die-hold', handleDieHold)
      el.removeEventListener('board-action', handleAction)
    }
  }, [currentUser, onAction])

  return <game-board ref={boardRef} style={{ display: 'block', width: '100%' }} />
}
