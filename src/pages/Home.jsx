import { useEffect, useMemo, useState } from 'react'
import Footer from '../components/Footer'
import { getCatalog, getFriends, getMyEvents, getMyLists } from '../api/client'
import s from './Home.module.css'

const features = [
  { icon: '🎁', title: 'Твій вішліст', text: 'Додавай бажані речі та ділися списками з близькими одним посиланням.' },
  { icon: '👥', title: 'Друзі', text: 'Переглядай списки друзів, резервуй подарунки й уникай повторів.' },
  { icon: '🗓️', title: 'Нагадування', text: 'Зберігай важливі дати та плануй приватні й групові події.' },
]

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function daysUntil(value) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  return Math.round((date - today) / 86400000)
}

function formatDays(value) {
  if (value === 0) return 'Сьогодні 🔥'
  if (value === 1) return 'Завтра 🔥'
  if (value > 1 && value < 5) return `${value} дні`
  return `${value} днів`
}

function firstName(user) {
  return user?.display_name?.trim().split(/\s+/)[0] || user?.username || 'друже'
}

export default function Home({ onNav, user }) {
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
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [])

  const totalItems = useMemo(
    () => lists.reduce((sum, list) => sum + Number(list?.items_count || 0), 0),
    [lists],
  )

  const upcomingEvents = useMemo(() => events
    .filter(event => event?.event_date)
    .map(event => ({ ...event, daysLeft: daysUntil(event.event_date) }))
    .filter(event => event.daysLeft >= 0)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 3), [events])

  const stats = [
    { icon: '📋', value: lists.length, label: 'Списків', page: 'lists' },
    { icon: '🎁', value: totalItems, label: 'Товарів', page: 'lists' },
    { icon: '👥', value: friends.length, label: 'Друзів', page: 'friends' },
    { icon: '🗓️', value: events.length, label: 'Для тебе', page: 'events' },
  ]

  return (
    <div className="anim-fade-up">
      <section className={s.hero}>
        <div className={s.heroLeft}>
          <div className={s.eyebrow}>✦ Your personal wishlist app</div>
          <h1 className={s.logo}>Wish<span>lle</span></h1>
          <p className={s.sub}>Зберігай мрії, ділись побажаннями з близькими і ніколи не забувай про важливі дати.</p>
          <div className={s.heroBtns}>
            <button type="button" className="btn-primary" onClick={() => onNav('lists')}>＋ Створити список</button>
            <button type="button" className="btn-outline" onClick={() => onNav('events')}>＋ Створити подію</button>
          </div>
        </div>

        <div className={s.heroRight}>
          <div className={s.heroAv}>
            {user?.avatar_url
              ? <img src={user.avatar_url} alt="Аватар" referrerPolicy="no-referrer" />
              : '😎'}
          </div>
          <div className={s.heroGreeting}>
            <div className={s.hg1}>Привіт, {firstName(user)} 👋</div>
            <div className={s.hg2}>Що подаруємо сьогодні?</div>
          </div>
        </div>
      </section>

      <div className="wrap">
        <section className={s.statsRow} aria-label="Статистика">
          {stats.map(stat => (
            <button type="button" key={stat.label} className={s.statCard} onClick={() => onNav(stat.page)}>
              <span className={s.statIcon}>{stat.icon}</span>
              <span>
                <strong className={s.statNum}>{loading ? '—' : stat.value}</strong>
                <small className={s.statLabel}>{stat.label}</small>
              </span>
            </button>
          ))}
        </section>
      </div>

      <div className="wrap">
        <div className="section-header" style={{ paddingTop: 28 }}>
          <div className="section-title">Найближчі події</div>
          <button type="button" className="section-link" onClick={() => onNav('events')}>Дивитись усі →</button>
        </div>

        {upcomingEvents.length === 0 ? (
          <button type="button" className={s.emptyEvents} onClick={() => onNav('events')}>
            <span>🗓️</span>
            <div>
              <strong>Поки немає найближчих подій</strong>
              <small>Створи подію або додай дату народження у профілі.</small>
            </div>
            <b>＋ Додати</b>
          </button>
        ) : (
          <div className={s.eventsStrip}>
            {upcomingEvents.map(event => (
              <button type="button" key={event.id || `${event.title}-${event.event_date}`} className={s.evCard} onClick={() => onNav('events')}>
                <div className={s.evCover}>🎂</div>
                <div className={s.evBadge}>🗓️ {event.event_type === 'birthday' ? 'День народження' : 'Подія'}</div>
                <div className={s.evBody}>
                  <div className={s.evName}>{event.title || 'Подія'}</div>
                  <div className={s.evDate}>{new Date(event.event_date).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })}</div>
                  <span className={`${s.evCount} ${event.daysLeft <= 1 ? s.urgent : ''}`}>{formatDays(event.daysLeft)}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="wrap">
        <div className="section-header" style={{ paddingTop: 38 }}>
          <div className="section-title">Можливості Wishlle</div>
        </div>
        <div className={s.featuresGrid}>
          {features.map(feature => (
            <article key={feature.title} className={s.featureCard}>
              <div className={s.featureIcon}>{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </article>
          ))}
        </div>
      </div>

      {catalog.length > 0 && (
        <div className="wrap">
          <div className="section-header" style={{ paddingTop: 38 }}>
            <div className="section-title">Підбірка для натхнення</div>
            <button type="button" className="section-link" onClick={() => onNav('catalog')}>До каталогу →</button>
          </div>
          <div className={s.catalogGrid}>
            {catalog.map(item => (
              <article key={item.id} className={s.catalogCard}>
                <div className={s.catalogImg}>
                  {item.image_url
                    ? <img src={item.image_url} alt={item.title || 'Товар'} loading="lazy" />
                    : '🎁'}
                </div>
                <div className={s.catalogBody}>
                  <div className={s.catalogName}>{item.title || 'Ідея подарунка'}</div>
                  <div className={s.catalogPrice}>{item.price ? `${item.price} ${item.currency || '₴'}` : ''}</div>
                </div>
                <div className={s.catalogOverlay}>
                  <button type="button" className="btn-cyan" onClick={() => onNav('catalog')}>Переглянути</button>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      <div className="wrap"><Footer /></div>
    </div>
  )
}
