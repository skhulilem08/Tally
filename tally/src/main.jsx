import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import './focus.css'
import './accent-icons.css'

document.documentElement.dataset.inputModality = 'pointer'
window.addEventListener('pointerdown', () => {
  document.documentElement.dataset.inputModality = 'pointer'
}, { capture: true, passive: true })
window.addEventListener('keydown', (event) => {
  if (event.key === 'Tab' || event.key.startsWith('Arrow')) {
    document.documentElement.dataset.inputModality = 'keyboard'
  }
}, { capture: true })

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
