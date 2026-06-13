import { useState } from 'react'
import { getCachedUser } from '../api/client'
import s from './Navbar.module.css'

const links = [
  { id: 'home',    label: 'Головна'  },
  { id: 'lists',   label: 'Мої списки' },
  { id: 'friends', label: 'Друзі'    },
  { id: 'events',  label: 'Події'    },
  { id: 'catalog', label: 'Каталог'  },
]

export default function Navbar({ current, onNav, onLogout }) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [dropOpen,   setDropOpen]   = useState(false)
  const user = getCachedUser()

  // Ініціали або перша літера імені
  const initials = user
    ? (user.display_name || user.username || '?')
        .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?'

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
          {user?.avatar_url
            ? <img src={user.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            : initials
          }
          {dropOpen && (
            <div className={s.dropdown}>
              {user && (
                <div style={{ padding: '8px 12px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: 4 }}>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{user.display_name || user.username}</div>
                  {user.username && <div style={{ color: 'rgba(255,255,255,0.42)', fontSize: '0.75rem' }}>@{user.username}</div>}
                </div>
              )}
              <a onClick={() => { onNav('account'); setDropOpen(false) }}>👤 Профіль</a>
              <a>⚙️ Налаштування</a>
              <hr />
              <a className={s.danger} onClick={() => { setDropOpen(false); onLogout?.() }}>🚪 Вийти</a>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
