import { useState } from 'react'
import Footer from '../components/Footer'

const categories = [
  { icon: '✨', label: 'Всі', count: 240 },
  { icon: '💻', label: 'Техніка', count: 84 },
  { icon: '📱', label: 'Гаджети', count: 52 },
  { icon: '👟', label: 'Одяг', count: 38 },
  { icon: '🏠', label: 'Дім', count: 29 },
  { icon: '🎮', label: 'Ігри', count: 21 },
  { icon: '📚', label: 'Книги', count: 16 },
  { icon: '✈️', label: 'Подорожі', count: 12 },
]

const products = [
  { emoji: '🎧', name: 'Apple AirPods Max',   price: '18 000 ₴', tag: 'green', tagLabel: 'В наявності', rating: '4.9' },
  { emoji: '⌚', name: 'Apple Watch SE 2',    price: '9 500 ₴',  tag: 'green', tagLabel: 'В наявності', rating: '4.8' },
  { emoji: '🎮', name: 'Asus ROG Ally',       price: '28 000 ₴', tag: 'cyan',  tagLabel: 'Новинка',     rating: '4.7' },
  { emoji: '📱', name: 'iPhone 15 Pro Max',   price: '55 000 ₴', tag: 'green', tagLabel: 'В наявності', rating: '4.9' },
  { emoji: '🪑', name: 'DXRacer Air Pro',     price: '12 000 ₴', tag: 'green', tagLabel: 'В наявності', rating: '4.6' },
  { emoji: '🖥️', name: 'LG UltraWide 34"',  price: '22 000 ₴', tag: 'orange',tagLabel: 'Замовлення',  rating: '4.7' },
  { emoji: '⌨️', name: 'Razer Huntsman V3',  price: '7 500 ₴',  tag: 'green', tagLabel: 'В наявності', rating: '4.8' },
  { emoji: '🖱️', name: 'Logitech G Pro X2',  price: '4 500 ₴',  tag: 'green', tagLabel: 'В наявності', rating: '4.9' },
]

const FILTERS = ['Популярне', 'Новинки', 'До 5 000 ₴', '5–20k ₴', 'Понад 20k']

export default function Catalog() {
  const [activeCat, setActiveCat] = useState(0)
  const [activeFilter, setActiveFilter] = useState(0)
  const [search, setSearch] = useState('')

  return (
    <div className="anim-fade-up">
      <div className="wrap">
        <div className="page-hero">
          <div><h1>Каталог 🛍️</h1><p>Знайди ідею для подарунка</p></div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24, paddingTop: 36 }} className="catalog-layout">
          {/* Sidebar */}
          <div style={{ position: 'sticky', top: 84, alignSelf: 'start' }} className="catalog-sidebar">
            {/* Categories */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 10 }}>Категорії</div>
              {categories.map((c, i) => (
                <div key={c.label} onClick={() => setActiveCat(i)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, fontSize: '0.82rem', fontWeight: 600, color: activeCat === i ? 'var(--cyan)' : 'var(--muted)', background: activeCat === i ? 'var(--cyan-glow)' : 'transparent', cursor: 'pointer', marginBottom: 2, transition: 'all 0.2s' }}>
                  <span style={{ width: 22 }}>{c.icon}</span>
                  <span style={{ flex: 1 }}>{c.label}</span>
                  <span style={{ fontSize: '0.65rem', background: 'var(--surface2)', padding: '1px 7px', borderRadius: 50 }}>{c.count}</span>
                </div>
              ))}
            </div>
            {/* Price */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 10 }}>Ціна (₴)</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="text" placeholder="Від" style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 8, padding: '8px 10px', color: 'var(--text)', fontFamily: 'Nunito, sans-serif', fontSize: '0.78rem', outline: 'none', width: 0 }} />
                <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>—</span>
                <input type="text" placeholder="До" style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 8, padding: '8px 10px', color: 'var(--text)', fontFamily: 'Nunito, sans-serif', fontSize: '0.78rem', outline: 'none', width: 0 }} />
              </div>
            </div>
          </div>

          {/* Main */}
          <div>
            <div className="search-wrap">
              <span className="s-icon">🔍</span>
              <input type="text" placeholder="Пошук товарів..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="pills">
              {FILTERS.map((f, i) => (
                <div key={f} className={`pill ${activeFilter === i ? 'active' : ''}`} onClick={() => setActiveFilter(i)}>{f}</div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 60 }}>
              {products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).map(p => (
                <div key={p.name} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.25s', position: 'relative' }}
                  onMouseEnter={e => { e.currentTarget.querySelector('.add-overlay').style.opacity = '1'; e.currentTarget.style.borderColor = 'rgba(0,200,232,0.2)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                  onMouseLeave={e => { e.currentTarget.querySelector('.add-overlay').style.opacity = '0'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = ''; }}>
                  <div style={{ aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.8rem', background: 'rgba(0,200,232,0.04)' }}>{p.emoji}</div>
                  <div style={{ padding: '11px 13px 13px' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: 4, lineHeight: 1.3 }}>{p.name}</div>
                    <div style={{ fontWeight: 900, fontSize: '0.9rem', color: 'var(--cyan)', marginBottom: 10 }}>{p.price}</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span className={`tag ${p.tag}`}>{p.tagLabel}</span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--muted)' }}>⭐ {p.rating}</span>
                    </div>
                  </div>
                  <div className="add-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,200,232,0.1)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}>
                    <button className="btn-cyan" style={{ fontSize: '0.8rem', padding: '10px 20px' }}>＋ В мій список</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </div>

      <style>{`
        @media (max-width: 768px) {
          .catalog-layout { grid-template-columns: 1fr !important; }
          .catalog-sidebar { display: none; }
        }
      `}</style>
    </div>
  )
}
