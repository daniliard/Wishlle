import { useEffect, useRef, useState } from 'react'
import AppIcon from './AppIcons'
import NotificationBell from './NotificationBell'
import { useLanguage } from '../i18n/LanguageContext'
import s from './Navbar.module.css'

function initials(user) {
  const value = user?.display_name || user?.username || 'W'
  return value.split(/\s+/).filter(Boolean).map(part => part[0]).join('').slice(0, 2).toUpperCase()
}

export default function Navbar({ current, onNav, onLogout, user }) {
  const { tr } = useLanguage()
  const [searchOpen, setSearchOpen] = useState(false)
  const [dropOpen, setDropOpen] = useState(false)
  const dropdownRef = useRef(null)

  const links = [
    { id: 'home', label: tr('Головна', 'Home') },
    { id: 'lists', label: tr('Мої списки', 'My lists') },
    { id: 'friends', label: tr('Друзі', 'Friends') },
    { id: 'events', label: tr('Події', 'Events') },
    { id: 'catalog', label: tr('Каталог', 'Catalog') },
  ]

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
      <button type="button" className={s.logo} onClick={() => navigate('home')} aria-label={tr('На головну', 'Go home')}>
        Wish<span>lle</span>
      </button>

      <nav className={s.links} aria-label={tr('Основна навігація', 'Main navigation')}>
        {links.map(link => (
          <button type="button" key={link.id} className={current === link.id ? s.active : ''} onClick={() => navigate(link.id)}>
            {link.label}
          </button>
        ))}
      </nav>

      <div className={s.right}>
        <div className={`${s.searchWrap} ${searchOpen ? s.open : ''}`}>
          <input type="search" placeholder={tr('Знайти користувача...', 'Find a user...')} aria-label={tr('Пошук користувача', 'User search')} />
        </div>

        <button type="button" className={s.iconBtn} onClick={() => setSearchOpen(value => !value)} aria-label={tr('Пошук', 'Search')}>
          <AppIcon name="search" size={18} />
        </button>

        <NotificationBell onNav={navigate} />

        <div className={s.profileWrap} ref={dropdownRef}>
          <button type="button" className={s.avatar} onClick={() => setDropOpen(value => !value)} aria-expanded={dropOpen}>
            {user?.avatar_url
              ? <img src={user.avatar_url} alt={tr('Аватар', 'Avatar')} referrerPolicy="no-referrer" />
              : <span>{initials(user)}</span>}
          </button>

          {dropOpen && (
            <div className={s.dropdown}>
              <div className={s.dropdownUser}>
                <strong>{user?.display_name || user?.username || tr('Користувач', 'User')}</strong>
                {user?.username && <span>@{user.username}</span>}
              </div>
              <button type="button" onClick={() => navigate('account')}><AppIcon name="profile" size={16} /> {tr('Профіль', 'Profile')}</button>
              <div className={s.divider} />
              <button type="button" className={s.danger} onClick={onLogout}><AppIcon name="logout" size={16} /> {tr('Вийти', 'Log out')}</button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
