import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { getToken } from './lib/auth.js'

// When a page is restored from the browser back/forward cache (bfcache),
// reload the app if an auth token exists so the app state stays in sync.
window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    const token = getToken()
    if (token) {
      window.location.reload()
    }
  }
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
