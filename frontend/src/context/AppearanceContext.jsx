import { createContext, useContext, useState, useEffect } from 'react'

const AppearanceContext = createContext(null)

export const BOARD_COLORS = [
  { label: 'Ocean',   value: '#1a5276' },
  { label: 'Forest',  value: '#1e8449' },
  { label: 'Crimson', value: '#922b21' },
  { label: 'Slate',   value: '#2c3e50' },
  { label: 'Gold',    value: '#9a7d0a' },
  { label: 'Purple',  value: '#6c3483' },
]

const DEFAULTS = {
  theme: 'light',
  boardColor: BOARD_COLORS[0].value,
  soundOn: true,
  lobbyCount: 5,
}

function loadFromStorage() {
  try {
    const stored = localStorage.getItem('appearance')
    return stored ? { ...DEFAULTS, ...JSON.parse(stored) } : DEFAULTS
  } catch {
    return DEFAULTS
  }
}

export function AppearanceProvider({ children }) {
  const [appearance, setAppearance] = useState(loadFromStorage)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', appearance.theme)
  }, [appearance.theme])

  useEffect(() => {
    document.documentElement.style.setProperty('--board-color', appearance.boardColor)
  }, [appearance.boardColor])

  useEffect(() => {
    localStorage.setItem('appearance', JSON.stringify(appearance))
  }, [appearance])

  function setTheme(theme) {
    setAppearance(prev => ({ ...prev, theme }))
  }

  function setBoardColor(boardColor) {
    setAppearance(prev => ({ ...prev, boardColor }))
  }

  function setSoundOn(soundOn) {
    setAppearance(prev => ({ ...prev, soundOn }))
  }

  function setLobbyCount(lobbyCount) {
    setAppearance(prev => ({ ...prev, lobbyCount: Number(lobbyCount) }))
  }

  function loadFromBackend(preferences) {
    setAppearance(prev => ({ ...prev, ...preferences }))
  }

  return (
    <AppearanceContext.Provider
      value={{
        ...appearance,
        setTheme,
        setBoardColor,
        setSoundOn,
        setLobbyCount,
        loadFromBackend,
        BOARD_COLORS,
      }}
    >
      {children}
    </AppearanceContext.Provider>
  )
}

export function useAppearance() {
  const ctx = useContext(AppearanceContext)
  if (!ctx) throw new Error('useAppearance must be used inside <AppearanceProvider>')
  return ctx
}