import { useState } from 'react'
import Footer from '../components/Footer'

const events = [
  { icon: '🎂', type: 'birthday', name: 'День народження Еліни',  date: 'Субота, 24 серпня 2025',      count: 'Завтра 🔥', urgency: 'urgent', avs: ['Е'], extra: 0 },
  { icon: '🎉', type: 'group',    name: 'Вечірка у Андрія',        date: 'Четвер, 29 серп. · 19:00',    count: '6 днів',    urgency: 'normal', avs: ['А','М','О','К'], extra: 5 },
  { icon: '🔒', type: 'private',  name: 'Річниця стосунків',        date: 'Понеділок, 2 вересня 2025',   count: '10 днів',   urgency: 'normal', avs: ['О'], extra: 0 },
  { icon: '🎂', type: 'birthday', name: 'День народження Андрія',   date: "П'ятниця, 29 серпня 2025",    count: '6 днів',    urgency: 'normal', avs: ['А'], extra: 0 },
  { icon: '🎂', type: 'birthday', name: 'День народження Олени',    date: 'Понеділок, 7 квітня 2026',    count: '226 днів',  urgency: 'far',    avs: ['О'], extra: 0 },
]

const typeColors = { birthday: 'rgba(247,162,57,0.12)', group: 'rgba(0,200,232,0.1)', private: 'rgba(167,139,250,0.12)' }
const calDays = ['','','','','1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31']

const FILTERS = ['Всі', 'Дні народження', 'Групові', 'Приватні']

export default function Events() {
  const [filter, setFilter] = useState(0)
  return (
    <div className="anim-fade-up">
      <div className="wrap">
        <div className="page-hero">
          <div><h1>Події 🗓️</h1><p>5 майбутніх подій</p></div>
          <div className="page-hero-actions">
            <button className="btn-outline">＋ Подія</button>
            <button className="btn-primary">🎂 День народження</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, paddingTop: 36, alignItems: 'start' }} className="events-layout">
          {/* List */}
          <div>
            <div className="pills">
              {FILTERS.map((f, i) => (
                <div key={f} className={`pill ${filter === i ? 'active' : ''}`} onClick={() => setFilter(i)}>{f}</div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 60 }}>
              {events.map(ev => (
                <div key={ev.name} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', transition: 'all 0.2s' }}>
                  <div style={{ width: 50, height: 50, borderRadius: 14, background: typeColors[ev.type], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>{ev.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.92rem', marginBottom: 3 }}>{ev.name}</div>
                    <div style={{ fontSize: '0.73rem', color: 'var(--muted)', marginBottom: 6 }}>{ev.date}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: -4 }}>
                      {ev.avs.map(a => <div key={a} style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,200,232,0.15)', border: '1.5px solid var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 800, color: 'var(--cyan)', marginRight: -4 }}>{a}</div>)}
                      {ev.extra > 0 && <span style={{ fontSize: '0.66rem', color: 'var(--muted)', marginLeft: 10 }}>+{ev.extra}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                    <div style={{ fontSize: '0.76rem', fontWeight: 800, padding: '4px 12px', borderRadius: 8, background: ev.urgency === 'urgent' ? 'rgba(240,91,91,0.12)' : ev.urgency === 'far' ? 'var(--surface2)' : 'rgba(0,200,232,0.1)', color: ev.urgency === 'urgent' ? 'var(--red)' : ev.urgency === 'far' ? 'var(--muted)' : 'var(--cyan)', whiteSpace: 'nowrap' }}>{ev.count}</div>
                    <button className="btn-sm cyan">Деталі</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Calendar */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 22, position: 'sticky', top: 84 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <button className="btn-sm">‹</button>
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--muted)' }}>Серпень 2025</span>
              <button className="btn-sm">›</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3, textAlign: 'center' }}>
              {['Пн','Вт','Ср','Чт','Пт','Сб','Нд'].map(d => <div key={d} style={{ fontSize: '0.62rem', color: 'var(--muted)', fontWeight: 700, padding: '3px 0' }}>{d}</div>)}
              {calDays.map((d, i) => (
                <div key={i} style={{ fontSize: '0.74rem', padding: '7px 3px', borderRadius: 8, color: d === '' ? 'transparent' : d === '23' ? 'var(--bg)' : ['24','29'].includes(d) ? 'var(--cyan)' : 'rgba(255,255,255,0.65)', background: d === '23' ? 'var(--cyan)' : 'transparent', fontWeight: ['23','24','29'].includes(d) ? 900 : 500, cursor: d ? 'pointer' : 'default', position: 'relative' }}>{d}</div>
              ))}
            </div>
          </div>
        </div>

        <Footer />
      </div>

      <style>{`
        @media (max-width: 768px) {
          .events-layout { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
