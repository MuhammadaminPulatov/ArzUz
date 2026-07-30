import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Telegram Mini App initsializatsiya — ekranni to'liq ochadi
const tg = (window as any).Telegram?.WebApp
if (tg) {
  tg.ready()
  tg.expand()
  tg.setHeaderColor('#F2F2F7')
  tg.setBackgroundColor('#F2F2F7')
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
