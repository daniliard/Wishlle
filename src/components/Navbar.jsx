import { useEffect, useRef, useState } from 'react'
import AppIcon from './AppIcons'
import s from './Navbar.module.css'

const links = [
  { id: 'home', label: 'Головна' },
  { id: 'lists', label: 'Мої списки' },
  { id: 'friends', label: 'Друзі' },
  { id: 'events', label: 'Події' },
  { id: 'catalog', label: 'Каталог' },
]

function initials(user) {
  const value = user?.display_name || user?.username || 'W'
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default function Navbar({ current, onNav, onLogout, user }) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [dropOpen, setDropOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function closeOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setDropOpen(false)
    }
    document.addEventListener('pointerdown', closeOutside)
    return () => document.removeEventListener('pointerdown', closeOutside)
  }, [])

  const navigate = (page) => {
    setDropOpen(false)
    onNav(page)
  }

  return (
    <header className={s.nav}>
      <button type="button" className={s.logo} onClick={() => navigate('home')} aria-label="На головну">
        Wish<span>lle</span>
      </button>

      <nav className={s.links} aria-label="Основна навігація">
        {links.map(link => (
          <button
            type="button"
            key={link.id}
            className={current === link.id ? s.active : ''}
            onClick={() => navigate(link.id)}
          >
            {link.label}
          </button>
        ))}
      </nav>

      <div className={s.right}>
        <div className={`${s.searchWrap} ${searchOpen ? s.open : ''}`}>
          <input type="search" placeholder="Знайти користувача..." aria-label="Пошук користувача" />
        </div>

        <button type="button" className={s.iconBtn} onClick={() => setSearchOpen(value => !value)} aria-label="Пошук">
          <AppIcon name="search" size={18} />
        </button>

        <button type="button" className={s.iconBtn} aria-label="Сповіщення">
          <AppIcon name="bell" size={18} />
          <span className={s.notifDot}>3</span>
        </button>

        <div className={s.profileWrap} ref={dropdownRef}>
          <button type="button" className={s.avatar} onClick={() => setDropOpen(value => !value)} aria-expanded={dropOpen}>
            {user?.avatar_url
              ? <img src={user.avatar_url} alt="Аватар" referrerPolicy="no-referrer" />
              : <span>{initials(user)}</span>}
          </button>

          {dropOpen && (
            <div className={s.dropdown}>
              <div className={s.dropdownUser}>
                <strong>{user?.display_name || user?.username || 'Користувач'}</strong>
                {user?.username && <span>@{user.username}</span>}
              </div>
              <button type="button" onClick={() => navigate('account')}><AppIcon name="profile" size={16} /> Профіль</button>
              <div className={s.divider} />
              <button type="button" className={s.danger} onClick={onLogout}><AppIcon name="logout" size={16} /> Вийти</button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
