import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Apply theme immediately to prevent flash of wrong theme
const savedTheme = localStorage.getItem('theme') ?? 'dark'
document.documentElement.classList.add(savedTheme)

// Apply language/dir immediately
const savedLang = localStorage.getItem('lang') ?? 'en'
document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr'
document.documentElement.lang = savedLang

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
