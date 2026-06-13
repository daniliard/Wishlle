import { useEffect, useState } from 'react'
import Navbar from './components/Navbar'
import BottomNav from './components/BottomNav'
import Home from './pages/Home'
import Lists from './pages/Lists'
import Friends from './pages/Friends'
import Events from './pages/Events'
import Catalog from './pages/Catalog'
import Account from './pages/Account'
import LandingPage from './pages/LandingPage'
import AuthCallback from './pages/AuthCallback'
import { isLoggedIn, loginTelegram, logout } from './api/client'
import { completeStoredBrowserLogin } from './auth/browserTelegram'
import { getTelegramInitData, isTelegramMiniApp, telegramReady } from './auth/telegram'

const PAGES = {
  home: Home,
  lists: Lists,
  friends: Friends,
  events: Events,
  catalog: Catalog,
  account: Account,
}

export default function App() {
  const [page, setPage] = useState('home')
  const [auth, setAuth] = useState(() => isLoggedIn())
  const [bootState, setBootState] = useState('checking')
  const [bootError, setBootError] = useState('')

  useEffect(() => {
    if (window.location.pathname === '/auth/callback') return

    let cancelled = false

    const boot = async () => {
      if (isLoggedIn()) {
        if (!cancelled) {
          setAuth(true)
          setBootState('ready')
        }
        return
      }

      try {
        // Mini App: Telegram уже передав підписаний initData. Жодних popup або redirect.
        if (isTelegramMiniApp()) {
          telegramReady()
          const initData = getTelegramInitData()
          if (!initData) throw new Error('Telegram не передав initData для Mini App.')
          await loginTelegram(initData)
          if (!cancelled) {
            setAuth(true)
            setBootState('ready')
          }
          return
        }

        // Fallback для браузерів, які відкрили callback у цій же вкладці.
        const completed = await completeStoredBrowserLogin()
        if (completed && !cancelled) {
          setAuth(true)
        }
      } catch (error) {
        console.error('Wishlle auth boot failed:', error)
        if (!cancelled) setBootError(error?.message || 'Помилка авторизації через Telegram.')
      } finally {
        if (!cancelled) setBootState('ready')
      }
    }

    boot()
    return () => { cancelled = true }
  }, [])

  if (window.location.pathname === '/auth/callback') {
    return <AuthCallback />
  }

  if (bootState === 'checking') {
    return (
      <div className="auth-screen">
        <div className="auth-screen__card">
          <div className="auth-spinner" aria-hidden="true" />
          <p>{isTelegramMiniApp() ? 'Входимо через Telegram…' : 'Завантажуємо Wishlle…'}</p>
        </div>
      </div>
    )
  }

  if (!auth) {
    return (
      <>
        {bootError && isTelegramMiniApp() ? (
          <div className="auth-screen">
            <div className="auth-screen__card auth-screen__card--error">
              <h2>Не вдалося увійти</h2>
              <p>{bootError}</p>
              <button type="button" className="btn-primary" onClick={() => window.location.reload()}>
                Спробувати ще раз
              </button>
            </div>
          </div>
        ) : (
          <LandingPage onLogin={() => { setBootError(''); setAuth(true) }} />
        )}
      </>
    )
  }

  const PageComponent = PAGES[page] || Home

  return (
    <>
      <Navbar
        current={page}
        onNav={setPage}
        onLogout={() => {
          logout()
          setAuth(false)
        }}
      />
      <div className="page-wrap">
        <PageComponent onNav={setPage} />
      </div>
      <BottomNav current={page} onNav={setPage} />
    </>
  )
}
