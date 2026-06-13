import { useState, useEffect } from 'react'
import Navbar       from './components/Navbar'
import BottomNav    from './components/BottomNav'
import Home         from './pages/Home'
import Lists        from './pages/Lists'
import Friends      from './pages/Friends'
import Events       from './pages/Events'
import Catalog      from './pages/Catalog'
import Account      from './pages/Account'
import LandingPage  from './pages/LandingPage'
import AuthCallback from './pages/AuthCallback'
import { isLoggedIn, logout, loginTelegram, finishBrowserLogin } from './api/client'
import { isTelegramMiniApp, getTelegramInitData, telegramReady } from './auth/telegram'

const PAGES = { home: Home, lists: Lists, friends: Friends, events: Events, catalog: Catalog, account: Account }

export default function App() {
  const [page, setPage]   = useState('home')
  const [auth, setAuth]   = useState(isLoggedIn)
  // 'idle' | 'mini-app-login' — стан автологіну в Telegram
  const [bootState, setBootState] = useState('idle')

  // ── Boot: Mini App автологін АБО завершення browser-redirect ─────────────
  useEffect(() => {
    if (auth) return
    if (window.location.pathname === '/auth/callback') return

    // 1) Telegram Mini App — автоматичний логін через initData
    if (isTelegramMiniApp()) {
      telegramReady()
      const initData = getTelegramInitData()
      if (initData) {
        setBootState('mini-app-login')
        loginTelegram(initData)
          .then(() => setAuth(true))
          .catch(err => {
            console.error('Mini App login failed:', err)
            setBootState('idle')
          })
        return
      }
    }

    // 2) Повернення з повного browser-redirect (popup був заблокований)
    const stored = sessionStorage.getItem('tg_auth_result')
    if (stored) {
      try {
        const r          = JSON.parse(stored)
        const verifier   = sessionStorage.getItem('tg_code_verifier')
        const savedState = sessionStorage.getItem('tg_state')
        if (r.code && verifier && r.state === savedState) {
          sessionStorage.removeItem('tg_auth_result')
          sessionStorage.removeItem('tg_code_verifier')
          sessionStorage.removeItem('tg_state')
          setBootState('mini-app-login')
          finishBrowserLogin(r.code, verifier)
            .then(() => setAuth(true))
            .catch(err => { console.error(err); setBootState('idle') })
        }
      } catch {}
    }
  }, [])

  // ── /auth/callback (повернення з браузерного OAuth) ──────────────────────
  if (window.location.pathname === '/auth/callback') {
    return <AuthCallback />
  }

  // ── Екран автологіну в Telegram ──────────────────────────────────────────
  if (bootState === 'mini-app-login') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b1623' }}>
        <div style={{ textAlign: 'center', color: '#eef4ff', fontFamily: 'Nunito, sans-serif' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>⏳</div>
          <p style={{ color: 'rgba(255,255,255,0.42)' }}>Вхід через Telegram...</p>
        </div>
      </div>
    )
  }

  // ── Не залогінений → лендінг (з браузерним popup-логіном) ────────────────
  if (!auth) {
    return <LandingPage onLogin={() => setAuth(true)} />
  }

  // ── Залогінений → додаток ────────────────────────────────────────────────
  const PageComponent = PAGES[page] || Home
  return (
    <>
      <Navbar current={page} onNav={setPage} onLogout={() => { logout(); setAuth(false) }} />
      <div className="page-wrap">
        <PageComponent onNav={setPage} />
      </div>
      <BottomNav current={page} onNav={setPage} />
    </>
  )
}
