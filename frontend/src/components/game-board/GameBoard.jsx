import { useRef, useEffect } from 'react'
import './game-board.js'

export default function GameBoard({ game, currentUser, socketState, onAction, onDieHold }) {
  const boardRef = useRef(null)

  useEffect(() => {
    const el = boardRef.current
    if (!el || !game) return
    el.gameData      = game
    el.currentUserId = currentUser?._id ?? ''
    el.socketState   = socketState ?? null
  }, [game, currentUser, socketState])

  useEffect(() => {
    const el = boardRef.current
    if (!el) return

    function handleDieHold(e) {
      onDieHold?.(e.detail.playerId, e.detail.dieIndex)
    }

    function handleAction(e) {
      onAction?.(e.detail.action, e.detail.amount)
    }

    el.addEventListener('board-die-hold', handleDieHold)
    el.addEventListener('board-action',   handleAction)
    return () => {
      el.removeEventListener('board-die-hold', handleDieHold)
      el.removeEventListener('board-action',   handleAction)
    }
  }, [onAction, onDieHold])

  return <game-board ref={boardRef} style={{ display: 'block', width: '100%' }} />
}
