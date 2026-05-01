import { useState } from 'react'
import Footer from '../components/Footer'
import s from './Home.module.css'

const upcoming = [
  { name: 'Еліни',   date: 'Субота, 24 серпня', days: 'Завтра 🔥', urgent: true },
  { name: 'Андрія',  date: 'Четвер, 29 серпня',  days: '6 днів',   urgent: false },
  { name: 'Олени',   date: 'Пн, 7 квітня 2026',  days: '226 днів', urgent: false },
]

const features = [
  { icon: '🎁', title: 'Твій вішліст',      text: 'Додавай речі які хочеш. Ділися списком одним посиланням.' },
  { icon: '👨‍👩‍👧', title: 'Сімейний простір', text: 'Дивись списки друзів, слідкуй за датами і завжди знай що подарувати.' },
  { icon: '🗓️', title: 'Календар подій',    text: 'Всі важливі дати в одному місці. Жодного пропущеного дня.' },
]

const activity = [
  { av: '👨', name: 'Андрій', text: 'додав 3 товари до «Хочу на ДН»', time: '2 год тому',  thumb: '⌨️' },
  { av: '👩', name: 'Еліна',  text: 'створила список «Японія ✈️»',     time: '5 год тому',  thumb: '🗾' },
  { av: '👩', name: 'Олена',  text: 'зарезервувала товар зі списку',   time: 'Вчора 19:30', thumb: '🎧' },
]

const catalog = [
  { emoji: '🎧', name: 'Apple AirPods Max',  price: '18 000 ₴' },
  { emoji: '⌚', name: 'Apple Watch SE 2',   price: '9 500 ₴' },
  { emoji: '🎮', name: 'Asus ROG Ally',      price: '28 000 ₴' },
  { emoji: '📱', name: 'iPhone 15 Pro Max',  price: '55 000 ₴' },
  { emoji: '🪑', name: 'DXRacer Air Pro',    price: '12 000 ₴' },
  { emoji: '🖥️', name: 'LG UltraWide 34"', price: '22 000 ₴' },
]

const stats = [
  { icon: '📋', num: '12', label: 'Списків' },
  { icon: '🎁', num: '47', label: 'Товарів' },
  { icon: '👥', num: '8',  label: 'Друзів' },
  { icon: '🔒', num: '3',  label: 'Для тебе' },
]

export default function Home({ onNav }) {
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
          <div className={s.heroAv}>😎</div>
          <div className={s.heroGreeting}>
            <div className={s.hg1}>Привіт, Максим 👋</div>
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
        <div className={s.eventsStrip}>
          {upcoming.map(ev => (
            <div key={ev.name} className={s.evCard} onClick={() => onNav('events')}>
              <div className={s.evCover}>🎂</div>
              <div className={s.evBadge}>🎂 День народження</div>
              <div className={s.evBody}>
                <div className={s.evName}>ДН {ev.name}</div>
                <div className={s.evDate}>{ev.date}</div>
                <span className={`${s.evCount} ${ev.urgent ? s.urgent : ''}`}>{ev.days}</span>
              </div>
            </div>
          ))}
        </div>
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

      {/* ACTIVITY */}
      <div className="wrap">
        <div className="section-header" style={{ paddingTop: 40 }}>
          <div className="section-title">Що нового у друзів</div>
          <a className="section-link" onClick={() => onNav('friends')}>До друзів →</a>
        </div>
        <div className={s.activityList}>
          {activity.map(a => (
            <div key={a.name} className={s.actItem} onClick={() => onNav('friends')}>
              <div className={s.actAv}>{a.av}</div>
              <div className={s.actText}>
                <p><strong>{a.name}</strong> {a.text}</p>
                <div className={s.actTime}>{a.time}</div>
              </div>
              <div className={s.actThumb}>{a.thumb}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CATALOG */}
      <div className="wrap">
        <div className="section-header" style={{ paddingTop: 40 }}>
          <div className="section-title">Підбірка для надихання</div>
          <a className="section-link" onClick={() => onNav('catalog')}>До каталогу →</a>
        </div>
        <div className={s.catalogGrid}>
          {catalog.map(c => (
            <div key={c.name} className={s.catalogCard}>
              <div className={s.catalogImg}>{c.emoji}</div>
              <div className={s.catalogBody}>
                <div className={s.catalogName}>{c.name}</div>
                <div className={s.catalogPrice}>{c.price}</div>
              </div>
              <div className={s.catalogOverlay}>
                <button className="btn-cyan" style={{ fontSize: '0.78rem', padding: '8px 16px' }}>＋ В список</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="wrap"><Footer /></div>
    </div>
  )
}
