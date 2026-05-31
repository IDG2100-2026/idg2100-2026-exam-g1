import { createContext, useContext, useState, useEffect } from 'react'

// Holds all visual preferences for component to read or change them
const AppearanceContext = createContext(null) // https://react.dev/reference/react/createContext

// Predefined board background colors the user can pick from
export const BOARD_COLORS = [
  { label: 'Ocean',   value: '#1a5276' },
  { label: 'Forest',  value: '#1e8449' },
  { label: 'Crimson', value: '#922b21' },
  { label: 'Slate',   value: '#2c3e50' },
  { label: 'Gold',    value: '#9a7d0a' },
  { label: 'Purple',  value: '#6c3483' },
]

// Default preferences used when no saved settings exist yet
const DEFAULTS = {
  theme: 'light',
  boardColor: BOARD_COLORS[0].value,
  soundOn: true,
  lobbyCount: 5,
}

// Read saved preferences from localStorage, falling back to DEFAULTS if nothing is stored
function loadFromStorage() {
  try {
    const stored = localStorage.getItem('appearance')
    return stored ? { ...DEFAULTS, ...JSON.parse(stored) } : DEFAULTS
  } catch {
    return DEFAULTS
  }
}

export function AppearanceProvider({ children }) {
  // Single state object holding all appearance fields
  const [appearance, setAppearance] = useState(loadFromStorage)

  // Keep the data-theme attribute on <html> in sync so CSS variables switch correctly
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', appearance.theme)
  }, [appearance.theme])

  // Keep the --board-color CSS variable in sync with the selected color
  useEffect(() => {
    document.documentElement.style.setProperty('--board-color', appearance.boardColor) // https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties
  }, [appearance.boardColor])

  // Persist every change to localStorage so preferences remember a page refresh
  useEffect(() => {
    localStorage.setItem('appearance', JSON.stringify(appearance))
  }, [appearance])

  // Individual setters — each merges one field into the appearance object
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

  // Called after login to restore preferences that were saved to the backend
  function loadFromBackend(preferences) {
    setAppearance(prev => ({ ...prev, ...preferences }))
  }

  return (
    <AppearanceContext.Provider
      value={{
        // Spread all fields so components can read them directly (e.g. theme, boardColor)
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

// Custom hook — use this in any component instead of importing useContext + AppearanceContext directly
export function useAppearance() {
  const ctx = useContext(AppearanceContext)
  if (!ctx) throw new Error('useAppearance must be used inside <AppearanceProvider>')
  return ctx
}