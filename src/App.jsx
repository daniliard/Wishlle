import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import BottomNav from './components/BottomNav'
import Home from './pages/Home'
import Lists from './pages/Lists'
import Friends from './pages/Friends'
import Events from './pages/Events'
import Catalog from './pages/Catalog'
import Account from './pages/Account'
import Login from './pages/Login'
import { isLoggedIn } from './api/client'

const PAGES = { home: Home, lists: Lists, friends: Friends, events: Events, catalog: Catalog, account: Account }

function isTelegramMiniApp() {
  // Перевіряємо чи відкрито всередині Telegram
  return window.location.href.includes('tgWebAppData') ||
    navigator.userAgent.includes('Telegram') ||
    (window.Telegram?.WebApp?.platform && window.Telegram.WebApp.platform !== 'unknown')
}

export default function App() {
  const [page, setPage] = useState('home')
  const [auth, setAuth] = useState(isLoggedIn())
  const [tgReady, setTgReady] = useState(false)
  const PageComponent = PAGES[page]

  useEffect(() => {
    // Підключаємо Telegram SDK тільки якщо це Mini App
    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-web-app.js'
    script.async = true
    script.onload = () => {
      if (window.Telegram?.WebApp?.initData) {
        window.Telegram.WebApp.ready()
        window.Telegram.WebApp.expand()
      }
      setTgReady(true)
    }
    document.head.appendChild(script)
  }, [])

  if (!auth) {
    return <Login onLogin={() => setAuth(true)} tgReady={tgReady} />
  }

  return (
    <>
      <Navbar current={page} onNav={setPage} />
      <div className="page-wrap">
        <PageComponent onNav={setPage} />
      </div>
      <BottomNav current={page} onNav={setPage} />
    </>
  )
}
