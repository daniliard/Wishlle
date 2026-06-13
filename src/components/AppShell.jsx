import { useEffect, useRef, useState } from 'react'
import AppIcon from './AppIcons'
import s from './AppShell.module.css'

const NAV_ITEMS = [
  { id: 'home', label: 'Головна', icon: 'home' },
  { id: 'lists', label: 'Мої списки', icon: 'lists' },
  { id: 'friends', label: 'Друзі', icon: 'friends' },
  { id: 'events', label: 'Події', icon: 'events' },
  { id: 'catalog', label: 'Каталог', icon: 'catalog' },
]

const PAGE_META = {
  home: { title: 'Головна', subtitle: 'Огляд твоїх списків, подій та активності' },
  lists: { title: 'Мої списки', subtitle: 'Створюй та впорядковуй свої побажання' },
  friends: { title: 'Друзі', subtitle: 'Знаходь близьких і переглядай їхні списки' },
  events: { title: 'Події', subtitle: 'Плануй важливі дати та запрошуй друзів' },
  catalog: { title: 'Каталог', subtitle: 'Шукай ідеї та додавай товари до списків' },
  account: { title: 'Профіль', subtitle: 'Керуй особистими даними та налаштуваннями' },
}

function getInitials(user) {
  const name = user?.display_name || user?.username || 'Wishlle'
  return name.split(/\s+/).filter(Boolean).map(part => part[0]).join('').slice(0, 2).toUpperCase()
}

function Avatar({ user, className = '' }) {
  return (
    <div className={`${s.avatar} ${className}`}>
      {user?.avatar_url
        ? <img src={user.avatar_url} alt="Аватар користувача" referrerPolicy="no-referrer" />
        : <span>{getInitials(user)}</span>}
    </div>
  )
}

export default function AppShell({ current, onNav, onLogout, user, children }) {
  const [profileOpen, setProfileOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const profileRef = useRef(null)
  const meta = PAGE_META[current] || PAGE_META.home

  useEffect(() => {
    function handleOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) setProfileOpen(false)
    }
    document.addEventListener('pointerdown', handleOutside)
    return () => document.removeEventListener('pointerdown', handleOutside)
  }, [])

  const navigate = (page) => {
    onNav(page)
    setMobileMenuOpen(false)
    setProfileOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className={s.shell}>
      <aside className={`${s.sidebar} ${mobileMenuOpen ? s.sidebarOpen : ''}`}>
        <button type="button" className={s.brand} onClick={() => navigate('home')} aria-label="На головну">
          <span className={s.brandMark}>W</span>
          <span className={s.brandText}>Wish<span>lle</span></span>
        </button>

        <div className={s.navCaption}>Навігація</div>
        <nav className={s.navList} aria-label="Основна навігація">
          {NAV_ITEMS.map(item => (
            <button
              type="button"
              key={item.id}
              className={`${s.navItem} ${current === item.id ? s.active : ''}`}
              onClick={() => navigate(item.id)}
            >
              <AppIcon name={item.icon} size={20} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className={s.sidebarSpacer} />

        <div className={s.sidebarHint}>
          <span className={s.hintIcon}><AppIcon name="sparkles" size={18} /></span>
          <div>
            <strong>Створи перший список</strong>
            <p>Додай бажання і поділися ними з друзями.</p>
            <button type="button" onClick={() => navigate('lists')}>Перейти <AppIcon name="arrowRight" size={14} /></button>
          </div>
        </div>

        <button type="button" className={`${s.navItem} ${current === 'account' ? s.active : ''}`} onClick={() => navigate('account')}>
          <AppIcon name="profile" size={20} />
          <span>Профіль</span>
        </button>
        <button type="button" className={`${s.navItem} ${s.logoutItem}`} onClick={onLogout}>
          <AppIcon name="logout" size={20} />
          <span>Вийти</span>
        </button>
      </aside>

      {mobileMenuOpen && <button type="button" className={s.backdrop} aria-label="Закрити меню" onClick={() => setMobileMenuOpen(false)} />}

      <div className={s.workspace}>
        <header className={s.topbar}>
          <div className={s.topbarLeft}>
            <button type="button" className={s.mobileMenuButton} onClick={() => setMobileMenuOpen(v => !v)} aria-label="Відкрити меню">
              <AppIcon name={mobileMenuOpen ? 'close' : 'menu'} size={22} />
            </button>
            <button type="button" className={s.mobileLogo} onClick={() => navigate('home')}>Wish<span>lle</span></button>
            <div className={s.pageHeading}>
              <h1>{meta.title}</h1>
              <p>{meta.subtitle}</p>
            </div>
          </div>

          <div className={s.topbarRight}>
            <button type="button" className={s.iconButton} aria-label="Сповіщення">
              <AppIcon name="bell" size={20} />
              <span className={s.notificationDot} />
            </button>

            <div className={s.profileWrap} ref={profileRef}>
              <button type="button" className={s.profileButton} onClick={() => setProfileOpen(v => !v)} aria-expanded={profileOpen}>
                <Avatar user={user} />
                <span className={s.profileText}>
                  <strong>{user?.display_name || user?.username || 'Користувач'}</strong>
                  <small>{user?.auth_provider === 'google' ? 'Google акаунт' : user?.auth_provider === 'telegram' ? 'Telegram акаунт' : 'Wishlle акаунт'}</small>
                </span>
                <AppIcon name="chevronDown" size={16} />
              </button>

              {profileOpen && (
                <div className={s.profileMenu}>
                  <div className={s.profileMenuHeader}>
                    <Avatar user={user} className={s.menuAvatar} />
                    <div>
                      <strong>{user?.display_name || user?.username || 'Користувач'}</strong>
                      {user?.username && <span>@{user.username}</span>}
                    </div>
                  </div>
                  <button type="button" onClick={() => navigate('account')}><AppIcon name="profile" size={17} /> Мій профіль</button>
                  <div className={s.menuDivider} />
                  <button type="button" className={s.menuLogout} onClick={onLogout}><AppIcon name="logout" size={17} /> Вийти</button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className={s.content}>{children}</main>
      </div>

      <nav className={s.mobileNav} aria-label="Мобільна навігація">
        {[
          { id: 'lists', label: 'Списки', icon: 'lists' },
          { id: 'friends', label: 'Друзі', icon: 'friends' },
          { id: 'events', label: 'Події', icon: 'events' },
          { id: 'catalog', label: 'Каталог', icon: 'catalog' },
          { id: 'account', label: 'Профіль', icon: 'profile' },
        ].map(item => (
          <button type="button" key={item.id} className={current === item.id ? s.mobileActive : ''} onClick={() => navigate(item.id)}>
            <AppIcon name={item.icon} size={21} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
