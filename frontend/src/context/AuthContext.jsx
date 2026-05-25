// Sources:
// - React createContext: https://react.dev/reference/react/createContext
// - React useContext: https://react.dev/reference/react/useContext
// - React useState: https://react.dev/reference/react/useState
// - localStorage API: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
// - JSON.parse / stringify: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON

import { createContext, useContext, useState } from 'react'

// Holds the logged-in user and token so any component can access them without prop drilling.
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // Restore user from localStorage so the session survives a page refresh
  // Source: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  // Restore token from localStorage as well
  const [token, setToken] = useState(() => localStorage.getItem('token'))

  // Store user and token in state and localStorage after a successful login
  function login(userData, authToken) {
    setCurrentUser(userData)
    setToken(authToken)
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('token', authToken ?? '')
  }

  // Clear user and token from state and localStorage on logout
  function logout() {
    setCurrentUser(null)
    setToken(null)
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }

  // Merge updated fields into the stored user object after a profile edit (e.g. new avatar)
  function updateUser(updatedFields) {
    const merged = { ...currentUser, ...updatedFields }
    setCurrentUser(merged)
    localStorage.setItem('user', JSON.stringify(merged))
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        token,
        // Just convenience boolean so components won't have to check currentUser !== null
        isLoggedIn: !!currentUser,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook — use this in any component instead of importing useContext + AuthContext directly
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}