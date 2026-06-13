import { useState, useEffect } from 'react'
import Navbar      from './components/Navbar'
import BottomNav   from './components/BottomNav'
import Home        from './pages/Home'
import Lists       from './pages/Lists'
import Friends     from './pages/Friends'
import Events      from './pages/Events'
import Catalog     from './pages/Catalog'
import Account     from './pages/Account'
import LandingPage from './pages/LandingPage'
import AuthCallback from './pages/AuthCallback'
import { isLoggedIn, logout } from './api/client'

const PAGES = { home: Home, lists: Lists, friends: Friends, events: Events, catalog: Catalog, account: Account }

export default function App() {
  const [page, setPage] = useState('home')
  const [auth, setAuth] = useState(isLoggedIn)

  // Якщо відкрились на /auth/callback — рендеримо лише обробник
  if (window.location.pathname === '/auth/callback') {
    return <AuthCallback />
  }

  if (!auth) {
    return <LandingPage onLogin={() => setAuth(true)} />
  }

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
