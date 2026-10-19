import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { applyTheme, getStoredTheme } from './lib/theme.js'

// Gespeichertes Farbdesign anwenden (Variablen, Spielerfarben, Browserleiste, Favicon)
applyTheme(getStoredTheme())

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)