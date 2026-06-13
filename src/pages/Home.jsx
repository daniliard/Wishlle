import { useState, useEffect } from 'react'
import Footer from '../components/Footer'
import s from './Home.module.css'
import { getMe, getMyLists, getMyEvents, getCatalog } from '../api/client'

const features = [
  { icon: '🎁', title: 'Твій вішліст',      text: 'Додавай речі які хочеш. Ділися списком одним посиланням.' },
  { icon: '👨‍👩‍👧', title: 'Сімейний простір', text: 'Дивись списки друзів, слідкуй за датами і завжди знай що подарувати.' },
  { icon: '🗓️', title: 'Календар подій',    text: 'Всі важливі дати в одному місці. Жодного пропущеного дня.' },
]

function daysUntil(dateStr) {
  const today = new Date(); today.setHours(0,0,0,0)
  const d = new Date(dateStr); d.setHours(0,0,0,0)
  return Math.round((d - today) / 86400000)
}

function formatDays(n) {
  if (n === 0) return 'Сьогодні 🔥'
  if (n === 1) return 'Завтра 🔥'
  return `${n} днів`
}

export default function Home({ onNav }) {
  const [user, setUser] = useState(null)
  const [lists, setLists] = useState([])
  const [events, setEvents] = useState([])
  const [catalog, setCatalog] = useState([])

  useEffect(() => {
    getMe().then(setUser).catch(() => {})
    getMyLists().then(data => setLists(Array.isArray(data) ? data : [])).catch(() => {})
    getMyEvents().then(data => setEvents(Array.isArray(data) ? data : [])).catch(() => {})
    getCatalog().then(data => setCatalog(Array.isArray(data) ? data.slice(0,6) : [])).catch(() => {})
  }, [])

  const firstName = user?.display_name?.split(' ')[0] || user?.username || 'друже'

  const stats = [
    { icon: '📋', num: lists.length, label: 'Списків' },
    { icon: '🎁', num: lists.reduce((a, l) => a + (l.items_count || 0), 0), label: 'Товарів' },
    { icon: '🗓️', num: events.length, label: 'Подій' },
  ]

  const upcomingEvents = events
    .filter(e => e.event_date)
    .map(e => ({ ...e, daysLeft: daysUntil(e.event_date) }))
    .filter(e => e.daysLeft >= 0)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 3)

  return (
    <div className="anim-fade-up">
      {/* HERO */}
      <section className={s.hero}>
        <div className={s.heroLeft}>
          <div className={s.eyebrow}>✦ Your personal wishlist app</div>
          <h1 className={s.logo}>Wish<span>lle</span></h1>
          <p className={s.sub}>Зберігай мрії, діліться побажаннями з близькими і ніколи не забувай про важливі дати.</p>
          <div className={s.heroBtns}>
            <button className="btn-primary" onClick={() => onNav('lists')}>＋ Створити список</button>
            <button className="btn-outline" onClick={() => onNav('events')}>＋ Створити подію</button>
          </div>
        </div>
        <div className={s.heroRight}>
          <div className={s.heroAv}>
            {user?.avatar_url
              ? <img src={user.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              : '😎'}
          </div>
          <div className={s.heroGreeting}>
            <div className={s.hg1}>Привіт, {firstName} 👋</div>
            <div className={s.hg2}>Що подаруємо сьогодні?</div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <div className="wrap">
        <div className={s.statsRow}>
          {stats.map(st => (
            <div key={st.label} className={s.statCard} onClick={() => onNav('lists')}>
              <div className={s.statIcon}>{st.icon}</div>
              <div>
                <div className={s.statNum}>{st.num}</div>
                <div className={s.statLabel}>{st.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* EVENTS */}
      <div className="wrap">
        <div className="section-header" style={{ paddingTop: 40 }}>
          <div className="section-title">Найближчі події</div>
          <a className="section-link" onClick={() => onNav('events')}>Дивитись усі →</a>
        </div>
        {upcomingEvents.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', padding: '20px 0', fontSize: '0.9rem' }}>
            Немає найближчих подій.{' '}
            <span style={{ color: 'var(--cyan)', cursor: 'pointer' }} onClick={() => onNav('events')}>Створити подію →</span>
          </div>
        ) : (
          <div className={s.eventsStrip}>
            {upcomingEvents.map(ev => (
              <div key={ev.id} className={s.evCard} onClick={() => onNav('events')}>
                <div className={s.evCover}>🎂</div>
                <div className={s.evBadge}>🗓️ {ev.event_type === 'birthday' ? 'День народження' : 'Подія'}</div>
                <div className={s.evBody}>
                  <div className={s.evName}>{ev.title}</div>
                  <div className={s.evDate}>{new Date(ev.event_date).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })}</div>
                  <span className={`${s.evCount} ${ev.daysLeft <= 1 ? s.urgent : ''}`}>{formatDays(ev.daysLeft)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FEATURES */}
      <div className="wrap">
        <div className="section-header" style={{ paddingTop: 40 }}>
          <div className="section-title">Можливості</div>
        </div>
        <div className={s.featuresGrid}>
          {features.map(f => (
            <div key={f.title} className={s.featureCard}>
              <div className={s.featureIcon}>{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CATALOG */}
      {catalog.length > 0 && (
        <div className="wrap">
          <div className="section-header" style={{ paddingTop: 40 }}>
            <div className="section-title">Підбірка для натхнення</div>
            <a className="section-link" onClick={() => onNav('catalog')}>До каталогу →</a>
          </div>
          <div className={s.catalogGrid}>
            {catalog.map(c => (
              <div key={c.id} className={s.catalogCard}>
                <div className={s.catalogImg}>
                  {c.image_url
                    ? <img src={c.image_url} alt={c.title} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} />
                    : '🎁'}
                </div>
                <div className={s.catalogBody}>
                  <div className={s.catalogName}>{c.title}</div>
                  <div className={s.catalogPrice}>{c.price ? `${c.price} ${c.currency || '₴'}` : ''}</div>
                </div>
                <div className={s.catalogOverlay}>
                  <button className="btn-cyan" style={{ fontSize: '0.78rem', padding: '8px 16px' }}>＋ В список</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="wrap"><Footer /></div>
    </div>
  )
}
