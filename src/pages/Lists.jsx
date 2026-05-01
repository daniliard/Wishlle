import { useState } from 'react'
import Footer from '../components/Footer'
import s from './Lists.module.css'

const lists = [
  { emoji: '🎂', grad: 'lc1', name: 'Хочу на день народження', meta: '12 товарів · 2 дні тому', thumbs: ['⌨️','🖱️','🎧'], extra: 9, progress: 25, reserved: '3 з 12', tag: 'cyan', tagLabel: 'Активний', badge: '🔓 Публічний' },
  { emoji: '🇯🇵', grad: 'lc2', name: 'Подорож до Японії ✈️',   meta: '8 товарів · тиждень тому', thumbs: ['🗺️','🎒','📷'], extra: 5,  progress: 0,  reserved: '0 з 8',  tag: 'muted', tagLabel: 'Приватний', badge: '🔒 Приватний' },
  { emoji: '🎮', grad: 'lc3', name: 'Гейм-сетап мрії',          meta: '15 товарів · сьогодні',   thumbs: ['🖥️','🎮','🪑'], extra: 12, progress: 33, reserved: '5 з 15', tag: 'cyan', tagLabel: 'Активний', badge: '🔓 Публічний' },
  { emoji: '🏠', grad: 'lc4', name: 'Для квартири',              meta: '6 товарів · з Оленою',    thumbs: ['🛋️','💡','🪴'], extra: 3,  progress: 33, reserved: '2 з 6',  tag: 'green', tagLabel: 'Спільний', badge: '👥 Спільний' },
  { emoji: '📚', grad: 'lc5', name: 'Книги на прочитання',       meta: '4 товари · місяць тому',  thumbs: ['📖','📕','📗'], extra: 1,  progress: 25, reserved: '1 з 4',  tag: 'orange', tagLabel: 'Мрія', badge: '🔓 Публічний' },
]

const wishes = [
  { emoji: '⌨️', name: 'Razer Huntsman V3',          meta: '«Хочу на ДН»', tag: 'cyan',  tagLabel: 'Зарезервовано', price: '7 500 ₴' },
  { emoji: '🖱️', name: 'Logitech G Pro X Superlight', meta: '«Хочу на ДН»', tag: 'green', tagLabel: 'Вільний',       price: '4 500 ₴' },
  { emoji: '🎧', name: 'Apple AirPods Max',            meta: '«Хочу на ДН»', tag: 'muted', tagLabel: 'Вільний',       price: '18 000 ₴' },
  { emoji: '🖥️', name: 'LG UltraWide 34"',            meta: '«Гейм-сетап»', tag: 'muted', tagLabel: 'Вільний',       price: '22 000 ₴' },
]

const FILTERS = ['Всі списки', 'Активні', 'Поділились зі мною', 'Архів']

export default function Lists() {
  const [filter, setFilter] = useState(0)
  return (
    <div className="anim-fade-up">
      <div className="wrap">
        <div className="page-hero">
          <div><h1>Мої списки 📋</h1><p>6 списків · 47 товарів загалом</p></div>
          <div className="page-hero-actions">
            <button className="btn-outline">Поділитись</button>
            <button className="btn-primary">＋ Новий список</button>
          </div>
        </div>

        <div style={{ paddingTop: 28 }}>
          <div className="pills">
            {FILTERS.map((f, i) => (
              <div key={f} className={`pill ${filter === i ? 'active' : ''}`} onClick={() => setFilter(i)}>{f}</div>
            ))}
          </div>
        </div>

        <div className={s.listsGrid}>
          {lists.map(l => (
            <div key={l.name} className={s.listCard}>
              <div className={`${s.listCover} ${s[l.grad]}`}>
                {l.emoji}
                <div className={s.lcBadge}>{l.badge}</div>
              </div>
              <div className={s.listBody}>
                <div className={s.listName}>{l.name}</div>
                <div className={s.listMeta}>{l.meta}</div>
                <div className={s.thumbs}>
                  {l.thumbs.map(t => <div key={t} className={s.thumb}>{t}</div>)}
                  <div className={`${s.thumb} ${s.thumbMore}`}>+{l.extra}</div>
                </div>
                <div className={s.listFooter}>
                  <div className={s.progressWrap}>
                    <div className={s.progressLabel}>Зарезервовано: {l.reserved}</div>
                    <div className={s.progressBar}><div className={s.progressFill} style={{ width: `${l.progress}%` }} /></div>
                  </div>
                  <span className={`tag ${l.tag}`}>{l.tagLabel}</span>
                </div>
              </div>
            </div>
          ))}
          <div className={s.addCard}>
            <div className={s.addPlus}>＋</div>
            <div>Створити новий список</div>
          </div>
        </div>

        {/* Top wishes */}
        <div className="section-header" style={{ paddingTop: 40 }}>
          <div className="section-title">Топ бажань</div>
          <a className="section-link">Всі →</a>
        </div>
        <div className={s.wishList}>
          {wishes.map(w => (
            <div key={w.name} className={s.wishRow}>
              <div className={s.wrImg}>{w.emoji}</div>
              <div className={s.wrInfo}>
                <div className={s.wrName}>{w.name}</div>
                <div className={s.wrMeta}>зі списку {w.meta}</div>
              </div>
              <span className={`tag ${w.tag}`}>{w.tagLabel}</span>
              <div className={s.wrPrice}>{w.price}</div>
              <div className={s.wrActions}>
                <div className="icon-btn">🔗</div>
                <div className="icon-btn">✏️</div>
                <div className="icon-btn">🗑️</div>
              </div>
            </div>
          ))}
        </div>

        <Footer />
      </div>
    </div>
  )
}
