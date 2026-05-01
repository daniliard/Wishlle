// ── FRIENDS ──
import { useState } from 'react'
import Footer from '../components/Footer'

const requests = [
  { av: '👩', name: 'Діана Сонячна',  user: '@diana_s · 12 спільних' },
  { av: '👨', name: 'Іван Мороз',      user: '@ivan_m · 3 спільних' },
]

const friends = [
  { av: '👩', name: 'Еліна Сонячна',   user: '@elina_s',  wishes: 31, bday: '24 серп. — завтра 🔥', soon: true },
  { av: '👨', name: 'Андрій Пинько',   user: '@andriy_p', wishes: 47, bday: '29 серп. — 6 днів',    soon: true },
  { av: '👩', name: 'Олена Карнавал',  user: '@olena_k',  wishes: 23, bday: '7 квіт. — 226 днів',   soon: false },
  { av: '👨', name: 'Кирило Власенко', user: '@kyrylo_v', wishes: 18, bday: '15 грудня',             soon: false },
  { av: '👩', name: 'Марія Кравець',   user: '@maria_k',  wishes: 12, bday: '3 лютого',              soon: false },
  { av: '👨', name: 'Денис Орлов',     user: '@denys_o',  wishes: 9,  bday: '22 вересня',            soon: false },
]

export function Friends() {
  const [search, setSearch] = useState('')
  const filtered = friends.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
  return (
    <div className="anim-fade-up">
      <div className="wrap">
        <div className="page-hero">
          <div><h1>Друзі 👥</h1><p>8 друзів · 2 запити</p></div>
          <div className="page-hero-actions"><button className="btn-primary">＋ Знайти друзів</button></div>
        </div>

        <div className="search-wrap" style={{ paddingTop: 28 }}>
          <span className="s-icon">🔍</span>
          <input type="text" placeholder="Знайти за юзернеймом..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Requests */}
        <div className="section-header"><div className="section-title">Запити у друзі <span className="tag red" style={{marginLeft:8}}>2</span></div></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 32 }}>
          {requests.map(r => (
            <div key={r.name} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(0,200,232,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>{r.av}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{r.name}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: 2 }}>{r.user}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-cyan" style={{ padding: '7px 14px', fontSize: '0.78rem' }}>✓ Прийняти</button>
                <button className="btn-sm danger">✕</button>
              </div>
            </div>
          ))}
        </div>

        {/* Friends grid */}
        <div className="section-header"><div className="section-title">Мої друзі ({filtered.length})</div></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14, marginBottom: 60 }}>
          {filtered.map(f => (
            <div key={f.name} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 20, textAlign: 'center', cursor: 'pointer', transition: 'all 0.25s' }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(0,200,232,0.12)', border: '2px solid rgba(0,200,232,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', margin: '0 auto 10px' }}>{f.av}</div>
              <div style={{ fontWeight: 800, fontSize: '0.92rem', marginBottom: 2 }}>{f.name}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginBottom: 8 }}>{f.user}</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginBottom: 10 }}>
                <div style={{ textAlign: 'center' }}><div style={{ fontWeight: 900, fontSize: '1rem', color: 'var(--cyan)' }}>{f.wishes}</div><div style={{ fontSize: '0.6rem', color: 'var(--muted)' }}>бажань</div></div>
              </div>
              <div style={{ fontSize: '0.7rem', color: f.soon ? 'var(--orange)' : 'var(--muted)', fontWeight: f.soon ? 700 : 400, marginBottom: 12 }}>🎂 {f.bday}</div>
              <button className="btn-sm cyan" style={{ width: '100%' }}>Переглянути списки</button>
            </div>
          ))}
        </div>
        <Footer />
      </div>
    </div>
  )
}
export default Friends
