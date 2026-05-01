import { useState } from 'react'
import Navbar from './components/Navbar'
import BottomNav from './components/BottomNav'
import Home from './pages/Home'
import Lists from './pages/Lists'
import Friends from './pages/Friends'
import Events from './pages/Events'
import Catalog from './pages/Catalog'
import Account from './pages/Account'

const PAGES = { home: Home, lists: Lists, friends: Friends, events: Events, catalog: Catalog, account: Account }

export default function App() {
  const [page, setPage] = useState('home')
  const PageComponent = PAGES[page]

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
