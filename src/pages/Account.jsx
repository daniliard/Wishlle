import { useState, useEffect } from 'react'
import Footer from '../components/Footer'
import { getMe, updateMe, logout } from '../api/client'

function Toggle({ value, onChange }) {
  return (
    <div
      className={`toggle ${value ? 'on' : ''}`}
      onClick={() => onChange(!value)}
      style={{ cursor: 'pointer' }}
    />
  )
}

export default function Account() {
  const [user, setUser] = useState(null)
  const [form, setForm] = useState({ display_name: '', username: '', birth_date: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [notifications, setNotifications] = useState({
    birthdays: true, reservations: true, friends: true, events: false, news: false,
  })

  useEffect(() => {
    getMe().then(u => {
      setUser(u)
      setForm({
        display_name: u.display_name || '',
        username: u.username || '',
        birth_date: u.birth_date || '',
      })
    }).catch(() => {})
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      const updated = await updateMe(form)
      setUser(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      alert('Помилка збереження: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const firstName = user?.display_name?.split(' ')[0] || user?.username || '...'

  return (
    <div className="anim-fade-up">
      <div className="wrap">
        <div className="page-hero">
          <div><h1>Акаунт 👤</h1></div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24, paddingTop: 36 }} className="account-layout">
          {/* Sidebar */}
          <div style={{ position: 'sticky', top: 84, alignSelf: 'start' }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 22, padding: 24, textAlign: 'center', marginBottom: 12 }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(0,200,232,0.12)', border: '2.5px solid rgba(0,200,232,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 12px', overflow: 'hidden' }}>
                {user?.avatar_url
                  ? <img src={user.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : '😎'}
              </div>
              <div style={{ fontFamily: 'Dancing Script, cursive', fontSize: '1.5rem', marginBottom: 2 }}>
                {user?.display_name || user?.username || '...'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: 16 }}>
                {user?.username ? `@${user.username}` : ''}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
                {user?.auth_provider === 'telegram' ? '🔵 Telegram' : '🔴 Google'}
              </div>
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 8 }}>
              <div
                onClick={logout}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 11, fontSize: '0.84rem', fontWeight: 600, color: 'var(--red)', cursor: 'pointer' }}
              >
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
                {[
                  ['Ім\'я та прізвище', 'display_name', 'text'],
                  ['Нікнейм', 'username', 'text'],
                  ['Дата народження', 'birth_date', 'date'],
                ].map(([label, key, type]) => (
                  <div key={key}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--muted)', marginBottom: 6 }}>{label}</div>
                    <input
                      type={type}
                      value={form[key]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 12, padding: '10px 14px', color: 'var(--text)', fontFamily: 'Nunito, sans-serif', fontSize: '0.86rem', outline: 'none' }}
                    />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button className="btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? 'Збереження...' : saved ? '✓ Збережено' : 'Зберегти'}
                </button>
              </div>
            </div>

            {/* Notifications */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 24, marginBottom: 16 }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 16 }}>Сповіщення</div>
              {[
                ['birthdays', '🔔 Дні народження друзів', 'За 1, 3 і 7 днів до події'],
                ['reservations', '🎁 Хтось зарезервував', 'Коли друг обрав товар'],
                ['friends', '👥 Нові запити у друзі', 'Push та Telegram'],
                ['events', '📢 Активність у подіях', 'Нові учасники та зміни'],
                ['news', '🛍️ Новини Wishlle', 'Оновлення та спецпропозиції'],
              ].map(([key, label, sub]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontSize: '0.86rem', fontWeight: 600 }}>{label}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: 1 }}>{sub}</div>
                  </div>
                  <Toggle value={notifications[key]} onChange={v => setNotifications(n => ({ ...n, [key]: v }))} />
                </div>
              ))}
            </div>

            {/* Danger */}
            <div style={{ background: 'var(--surface)', border: '1px solid rgba(240,91,91,0.2)', borderRadius: 20, padding: 24, marginBottom: 60 }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 16 }}>Небезпечна зона</div>
              <button onClick={logout} style={{ width: '100%', background: 'rgba(240,91,91,0.08)', border: '1px solid rgba(240,91,91,0.2)', borderRadius: 12, padding: 12, color: 'var(--red)', fontFamily: 'Nunito, sans-serif', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer', marginBottom: 8, display: 'block' }}>
                🚪 Вийти з акаунту
              </button>
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
