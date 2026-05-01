import { useState } from 'react'
import Footer from '../components/Footer'

const reserved = [
  { emoji: '⌨️', name: 'Razer Huntsman V3',  owner: 'резервує Андрій · «Хочу на ДН»',  price: '7 500 ₴' },
  { emoji: '🎧', name: 'Apple AirPods Max',   owner: 'резервує Олена · «Хочу на ДН»',   price: '18 000 ₴' },
  { emoji: '🖱️', name: 'Logitech G Pro X2',  owner: 'резервує Еліна · «Гейм-сетап»',   price: '4 500 ₴' },
]

const calDays = ['','','','','1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31']

function Toggle({ defaultOn = false }) {
  const [on, setOn] = useState(defaultOn)
  return <div className={`toggle ${on ? 'on' : ''}`} onClick={() => setOn(v => !v)} />
}

export default function Account() {
  return (
    <div className="anim-fade-up">
      <div className="wrap">
        <div className="page-hero">
          <div><h1>Акаунт 👤</h1></div>
          <div className="page-hero-actions"><button className="btn-outline">Редагувати профіль</button></div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24, paddingTop: 36 }} className="account-layout">
          {/* Sidebar */}
          <div style={{ position: 'sticky', top: 84, alignSelf: 'start' }}>
            {/* Profile card */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 22, padding: 24, textAlign: 'center', marginBottom: 12 }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(0,200,232,0.12)', border: '2.5px solid rgba(0,200,232,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 12px' }}>😎</div>
              <div style={{ fontFamily: 'Dancing Script, cursive', fontSize: '1.5rem', marginBottom: 2 }}>Максим Світозар</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: 16 }}>@maksym_sv</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginBottom: 18 }}>
                {[['6','Списків'],['47','Бажань'],['8','Друзів']].map(([n, l]) => (
                  <div key={l} style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--cyan)' }}>{n}</div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--muted)' }}>{l}</div>
                  </div>
                ))}
              </div>
              <button className="btn-outline" style={{ width: '100%', fontSize: '0.82rem' }}>✏️ Редагувати</button>
            </div>
            {/* Nav */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 8 }}>
              {[['👤','Мій профіль',true],['🔒','Приватність',false],['🔔','Сповіщення',false],['🎁','Зарезервовані',false],['💳','Підписка',false]].map(([icon, label, active]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 11, fontSize: '0.84rem', fontWeight: 600, color: active ? 'var(--cyan)' : 'var(--muted)', background: active ? 'var(--cyan-glow)' : 'transparent', cursor: 'pointer', marginBottom: 2 }}>
                  <span style={{ width: 22 }}>{icon}</span>{label}
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 11, fontSize: '0.84rem', fontWeight: 600, color: 'var(--red)', cursor: 'pointer' }}>
                <span style={{ width: 22 }}>🚪</span>Вийти
              </div>
            </div>
          </div>

          {/* Main */}
          <div>
            {/* Personal info */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 24, marginBottom: 16 }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 20 }}>Особиста інформація</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                {[['Ім\'я','Максим'],['Прізвище','Світозар'],['Нікнейм','@maksym_sv'],['Email','maksym@wishlle.app']].map(([label, val]) => (
                  <div key={label}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--muted)', marginBottom: 6 }}>{label}</div>
                    <input defaultValue={val} style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 12, padding: '10px 14px', color: 'var(--text)', fontFamily: 'Nunito, sans-serif', fontSize: '0.86rem', outline: 'none' }} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button className="btn-outline">Скасувати</button>
                <button className="btn-primary">Зберегти</button>
              </div>
            </div>

            {/* Calendar */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 24, marginBottom: 16 }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 16 }}>Серпень 2025</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3, textAlign: 'center' }}>
                {['Пн','Вт','Ср','Чт','Пт','Сб','Нд'].map(d => <div key={d} style={{ fontSize: '0.62rem', color: 'var(--muted)', fontWeight: 700, padding: '3px 0' }}>{d}</div>)}
                {calDays.map((d, i) => (
                  <div key={i} style={{ fontSize: '0.72rem', padding: '6px 2px', borderRadius: 7, color: d === '' ? 'transparent' : d === '23' ? 'var(--bg)' : ['24','29'].includes(d) ? 'var(--cyan)' : 'rgba(255,255,255,0.6)', background: d === '23' ? 'var(--cyan)' : 'transparent', fontWeight: ['23','24','29'].includes(d) ? 900 : 400 }}>{d || '·'}</div>
                ))}
              </div>
            </div>

            {/* Notifications */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 24, marginBottom: 16 }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 16 }}>Сповіщення</div>
              {[['🔔 Дні народження друзів', 'За 3, 7 і 14 днів до події', true],['🎁 Хтось зарезервував', 'Коли друг обрав товар', true],['👥 Нові запити у друзі', 'Push та email', true],['📢 Активність у подіях', 'Нові учасники та зміни', false],['🛍️ Новини Wishlle', 'Оновлення та спецпропозиції', false]].map(([label, sub, on]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontSize: '0.86rem', fontWeight: 600 }}>{label}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: 1 }}>{sub}</div>
                  </div>
                  <Toggle defaultOn={on} />
                </div>
              ))}
            </div>

            {/* Reserved */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 24, marginBottom: 16 }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 16 }}>Зарезервовано для тебе (3)</div>
              {reserved.map(r => (
                <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(0,200,232,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>{r.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.86rem', marginBottom: 2 }}>{r.name}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--muted)' }}>{r.owner}</div>
                  </div>
                  <div style={{ fontWeight: 900, color: 'var(--cyan)', fontSize: '0.88rem' }}>{r.price}</div>
                </div>
              ))}
            </div>

            {/* Danger */}
            <div style={{ background: 'var(--surface)', border: '1px solid rgba(240,91,91,0.2)', borderRadius: 20, padding: 24, marginBottom: 60 }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 16 }}>Небезпечна зона</div>
              {['🗑️ Видалити всі списки','❌ Видалити акаунт'].map(label => (
                <button key={label} style={{ width: '100%', background: 'rgba(240,91,91,0.08)', border: '1px solid rgba(240,91,91,0.2)', borderRadius: 12, padding: 12, color: 'var(--red)', fontFamily: 'Nunito, sans-serif', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer', marginBottom: 8, display: 'block' }}>{label}</button>
              ))}
            </div>
          </div>
        </div>

        <Footer />
      </div>

      <style>{`
        @media (max-width: 768px) {
          .account-layout { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
