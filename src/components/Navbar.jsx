import { useState } from 'react'
import s from './Navbar.module.css'

const links = [
  { id: 'home',    label: 'Головна' },
  { id: 'lists',   label: 'Мої списки' },
  { id: 'friends', label: 'Друзі' },
  { id: 'events',  label: 'Події' },
  { id: 'catalog', label: 'Каталог' },
]

export default function Navbar({ current, onNav }) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [dropOpen, setDropOpen] = useState(false)

  return (
    <nav className={s.nav}>
      <div className={s.logo} onClick={() => onNav('home')}>Wishlle</div>

      <div className={s.links}>
        {links.map(l => (
          <a key={l.id} className={current === l.id ? s.active : ''} onClick={() => onNav(l.id)}>
            {l.label}
          </a>
        ))}
      </div>

      <div className={s.right}>
        <div className={`${s.searchWrap} ${searchOpen ? s.open : ''}`}>
          <input type="text" placeholder="Знайти користувача..." />
        </div>
        <div className={s.iconBtn} onClick={() => setSearchOpen(v => !v)}>🔍</div>
        <div className={s.iconBtn} style={{ position: 'relative' }}>
          🔔
          <div className={s.notifDot}>3</div>
        </div>
        <div className={s.avatar} onClick={() => setDropOpen(v => !v)}>
          МС
          {dropOpen && (
            <div className={s.dropdown}>
              <a onClick={() => { onNav('account'); setDropOpen(false) }}>👤 Профіль</a>
              <a>⚙️ Налаштування</a>
              <hr />
              <a className={s.danger}>🚪 Вийти</a>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
