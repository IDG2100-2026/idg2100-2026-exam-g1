// Sources:
// - React StrictMode:  https://react.dev/reference/react/StrictMode
// - ReactDOM createRoot: https://react.dev/reference/react-dom/client/createRoot

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
