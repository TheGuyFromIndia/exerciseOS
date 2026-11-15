import React from 'react'
import * as ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Configure iOS / Safari Audio Session for audio ducking
// 'transient' tells iOS to play speech over background music (like Spotify)
// and duck (lower) music volume rather than stopping playback
if (typeof navigator !== 'undefined' && 'audioSession' in navigator) {
  try {
    (navigator as unknown as { audioSession: { type: string } }).audioSession.type = 'transient';
  } catch {
    // Unsupported or blocked
  }
}

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}
