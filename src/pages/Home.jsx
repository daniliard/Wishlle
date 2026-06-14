import { useEffect, useMemo, useState } from 'react'
import Footer from '../components/Footer'
import { getCatalog, getFriends, getMyEvents, getMyLists } from '../api/client'
import { useLanguage } from '../i18n/LanguageContext'
import s from './Home.module.css'

function asArray(value) { return Array.isArray(value) ? value : [] }
function daysUntil(value) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const date = new Date(value); date.setHours(0, 0, 0, 0)
  return Math.round((date - today) / 86400000)
}

export default function Home({ onNav, user }) {
  const { tr, locale } = useLanguage()
  const [lists, setLists] = useState([])
  const [events, setEvents] = useState([])
  const [friends, setFriends] = useState([])
  const [catalog, setCatalog] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    Promise.allSettled([getMyLists(), getMyEvents(), getFriends(), getCatalog()])
      .then(([listsResult, eventsResult, friendsResult, catalogResult]) => {
        if (cancelled) return
        if (listsResult.status === 'fulfilled') setLists(asArray(listsResult.value))
        if (eventsResult.status === 'fulfilled') setEvents(asArray(eventsResult.value))
        if (friendsResult.status === 'fulfilled') setFriends(asArray(friendsResult.value))
        if (catalogResult.status === 'fulfilled') setCatalog(asArray(catalogResult.value).slice(0, 6))
      }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const totalItems = useMemo(() => lists.reduce((sum, list) => sum + Number(list?.items_count || 0), 0), [lists])
  const upcomingEvents = useMemo(() => events.filter(event => event?.event_date).map(event => ({ ...event, daysLeft: daysUntil(event.event_date) })).filter(event => event.daysLeft >= 0).sort((a, b) => a.daysLeft - b.daysLeft).slice(0, 3), [events])

  const firstName = user?.display_name?.trim().split(/\s+/)[0] || user?.username || tr('друже', 'friend')
  const formatDays = (value) => {
    if (value === 0) return tr('Сьогодні 🔥', 'Today 🔥')
    if (value === 1) return tr('Завтра 🔥', 'Tomorrow 🔥')
    return tr(`${value} днів`, `${value} days`)
  }
  const features = [
    { icon: '🎁', title: tr('Твій вішліст', 'Your wishlist'), text: tr('Додавай бажані речі та ділися списками з близькими одним посиланням.', 'Add desired items and share lists with loved ones using one link.') },
    { icon: '👥', title: tr('Друзі', 'Friends'), text: tr('Переглядай списки друзів, резервуй подарунки й уникай повторів.', 'Browse friends’ lists, reserve gifts and avoid duplicates.') },
    { icon: '🗓️', title: tr('Нагадування', 'Reminders'), text: tr('Зберігай важливі дати та плануй приватні й групові події.', 'Save important dates and plan private or group events.') },
  ]
  const stats = [
    { icon: '📋', value: lists.length, label: tr('Списків', 'Lists'), page: 'lists' },
    { icon: '🎁', value: totalItems, label: tr('Товарів', 'Items'), page: 'lists' },
    { icon: '👥', value: friends.length, label: tr('Друзів', 'Friends'), page: 'friends' },
    { icon: '🗓️', value: events.length, label: tr('Для тебе', 'For you'), page: 'events' },
  ]

  return (
    <div className="anim-fade-up">
      <section className={s.hero}>
        <div className={s.heroLeft}>
          <div className={s.eyebrow}>✦ Your personal wishlist app</div>
          <h1 className={s.logo}>Wish<span>lle</span></h1>
          <p className={s.sub}>{tr('Зберігай мрії, ділись побажаннями з близькими і ніколи не забувай про важливі дати.', 'Save dreams, share wishes with loved ones and never forget important dates.')}</p>
          <div className={s.heroBtns}>
            <button type="button" className="btn-primary" onClick={() => onNav('lists')}>＋ {tr('Створити список', 'Create list')}</button>
            <button type="button" className="btn-outline" onClick={() => onNav('events')}>＋ {tr('Створити подію', 'Create event')}</button>
          </div>
        </div>
        <div className={s.heroRight}>
          <div className={s.heroAv}>{user?.avatar_url ? <img src={user.avatar_url} alt={tr('Аватар', 'Avatar')} referrerPolicy="no-referrer" /> : '😎'}</div>
          <div className={s.heroGreeting}><div className={s.hg1}>{tr('Привіт', 'Hi')}, {firstName} 👋</div><div className={s.hg2}>{tr('Що подаруємо сьогодні?', 'What shall we gift today?')}</div></div>
        </div>
      </section>

      <div className="wrap"><section className={s.statsRow} aria-label={tr('Статистика', 'Statistics')}>{stats.map(stat => <button type="button" key={stat.label} className={s.statCard} onClick={() => onNav(stat.page)}><span className={s.statIcon}>{stat.icon}</span><span><strong className={s.statNum}>{loading ? '—' : stat.value}</strong><small className={s.statLabel}>{stat.label}</small></span></button>)}</section></div>

      <div className="wrap">
        <div className="section-header" style={{ paddingTop: 28 }}><div className="section-title">{tr('Найближчі події', 'Upcoming events')}</div><button type="button" className="section-link" onClick={() => onNav('events')}>{tr('Дивитись усі', 'View all')} →</button></div>
        {upcomingEvents.length === 0 ? (
          <button type="button" className={s.emptyEvents} onClick={() => onNav('events')}><span>🗓️</span><div><strong>{tr('Поки немає найближчих подій', 'No upcoming events yet')}</strong><small>{tr('Створи подію або додай дату народження у профілі.', 'Create an event or add your birth date in the profile.')}</small></div><b>＋ {tr('Додати', 'Add')}</b></button>
        ) : (
          <div className={s.eventsStrip}>{upcomingEvents.map(event => <button type="button" key={event.id || `${event.title}-${event.event_date}`} className={s.evCard} onClick={() => onNav('events')}><div className={s.evCover}>🎂</div><div className={s.evBadge}>🗓️ {event.event_type === 'birthday' ? tr('День народження', 'Birthday') : tr('Подія', 'Event')}</div><div className={s.evBody}><div className={s.evName}>{event.title || tr('Подія', 'Event')}</div><div className={s.evDate}>{new Date(event.event_date).toLocaleString(locale, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</div><span className={`${s.evCount} ${event.daysLeft <= 1 ? s.urgent : ''}`}>{formatDays(event.daysLeft)}</span></div></button>)}</div>
        )}
      </div>

      <div className="wrap"><div className="section-header" style={{ paddingTop: 38 }}><div className="section-title">{tr('Можливості Wishlle', 'Wishlle features')}</div></div><div className={s.featuresGrid}>{features.map(feature => <article key={feature.title} className={s.featureCard}><div className={s.featureIcon}>{feature.icon}</div><h3>{feature.title}</h3><p>{feature.text}</p></article>)}</div></div>

      {catalog.length > 0 && <div className="wrap"><div className="section-header" style={{ paddingTop: 38 }}><div className="section-title">{tr('Підбірка для натхнення', 'Ideas for inspiration')}</div><button type="button" className="section-link" onClick={() => onNav('catalog')}>{tr('До каталогу', 'Open catalog')} →</button></div><div className={s.catalogGrid}>{catalog.map(item => <article key={item.id} className={s.catalogCard}><div className={s.catalogImg}>{item.image_url ? <img src={item.image_url} alt={item.title || tr('Товар', 'Item')} loading="lazy" /> : '🎁'}</div><div className={s.catalogBody}><div className={s.catalogName}>{item.title || tr('Ідея подарунка', 'Gift idea')}</div><div className={s.catalogPrice}>{item.price ? `${item.price} ${item.currency || '₴'}` : ''}</div></div><div className={s.catalogOverlay}><button type="button" className="btn-cyan" onClick={() => onNav('catalog')}>{tr('Переглянути', 'View')}</button></div></article>)}</div></div>}

      <div className="wrap"><Footer /></div>
    </div>
  )
}
