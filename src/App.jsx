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
import { getMe, isLoggedIn, loginTelegram, logout } from './api/client'
import { completeStoredBrowserLogin } from './auth/browserTelegram'
import { isTelegramMiniApp, looksLikeTelegramLaunch, telegramReady, waitForTelegramInitData } from './auth/telegram'

const PAGES = {
  home: Home,
  lists: Lists,
  friends: Friends,
  events: Events,
  catalog: Catalog,
  account: Account,
}

export default function App() {
  const authParams = new URLSearchParams(window.location.search)
  const isOAuthCallback =
    window.location.pathname === '/auth/callback' ||
    authParams.has('code') ||
    authParams.has('error')

  const [page, setPage] = useState('home')
  const [auth, setAuth] = useState(() => isLoggedIn())
  const [user, setUser] = useState(null)
  const [bootState, setBootState] = useState('checking')
  const [bootError, setBootError] = useState('')

  const refreshUser = async () => {
    const current = await getMe()
    setUser(current || null)
    return current
  }

  useEffect(() => {
    if (isOAuthCallback) return

    let cancelled = false

    const boot = async () => {
      if (isLoggedIn()) {
        if (!cancelled) {
          setAuth(true)
          await refreshUser()
          setBootState('ready')
        }
        return
      }

      try {
        const initData = await waitForTelegramInitData()
        if (initData) {
          telegramReady()
          await loginTelegram(initData)
          if (!cancelled) {
            setAuth(true)
            await refreshUser()
            setBootState('ready')
          }
          return
        }

        const completed = await completeStoredBrowserLogin()
        if (completed && !cancelled) {
          setAuth(true)
          await refreshUser()
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
  }, [isOAuthCallback])

  useEffect(() => {
    if (!auth || isOAuthCallback) return
    refreshUser().catch(() => {})
  }, [auth, isOAuthCallback])

  if (isOAuthCallback) return <AuthCallback />

  if (bootState === 'checking') {
    return (
      <div className="auth-screen">
        <div className="auth-screen__card">
          <div className="auth-spinner" aria-hidden="true" />
          <p>{isTelegramMiniApp() || looksLikeTelegramLaunch() ? 'Входимо через Telegram…' : 'Завантажуємо Wishlle…'}</p>
        </div>
      </div>
    )
  }

  if (!auth) {
    return bootError && isTelegramMiniApp() ? (
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
      <LandingPage
        onLogin={async () => {
          setBootError('')
          setAuth(true)
          await refreshUser().catch(() => {})
        }}
      />
    )
  }

  const PageComponent = PAGES[page] || Home
  const handleLogout = () => {
    logout()
    setUser(null)
    setAuth(false)
  }
  const navigate = (nextPage) => {
    setPage(nextPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <Navbar current={page} onNav={navigate} onLogout={handleLogout} user={user} />
      <div className="page-wrap">
        <PageComponent
          onNav={navigate}
          user={user}
          onUserUpdated={(updatedUser) => setUser(updatedUser)}
          onLogout={handleLogout}
        />
      </div>
      <BottomNav current={page} onNav={navigate} />
    </>
  )
}
