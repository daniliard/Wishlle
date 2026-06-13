import { useState, useEffect } from 'react'
import Footer from '../components/Footer'
import { getMe, updateMe, logout } from '../api/client'

function Toggle({ value, onChange }) {
  return (
    <div className={`toggle ${value ? 'on' : ''}`} onClick={() => onChange(!value)} />
  )
}

export default function Account({ onNav }) {
  const [user, setUser]   = useState(null)
  const [form, setForm]   = useState({ display_name: '', username: '', birth_date: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [notifications, setNotifications] = useState({
    birthdays: true, reservations: true, friends: true, events: false,
  })

  useEffect(() => {
    getMe().then(u => {
      if (!u) return
      setUser(u)
      setForm({ display_name: u.display_name || '', username: u.username || '', birth_date: u.birth_date || '' })
    }).catch(() => {})
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      await updateMe(form)
      setSaved(true)
      setTimeout(() => setSaved(false), 2200)
    } catch (e) { alert('Помилка: ' + e.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="anim-fade-up">
      <div className="wrap">
        <div className="page-hero"><div><h1>Акаунт 👤</h1></div></div>

        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20, paddingTop: 32 }} className="account-layout">
          {/* Сайдбар */}
          <div style={{ position: 'sticky', top: 84, alignSelf: 'start' }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 22, padding: 24, textAlign: 'center', marginBottom: 12 }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(0,200,232,0.12)', border: '2.5px solid rgba(0,200,232,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 12px', overflow: 'hidden' }}>
                {user?.avatar_url
                  ? <img src={user.avatar_url} alt="av" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : '😎'}
              </div>
              <div style={{ fontFamily: 'Dancing Script, cursive', fontSize: '1.4rem', marginBottom: 2 }}>
                {user?.display_name || user?.username || '...'}
              </div>
              {user?.username && <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: 10 }}>@{user.username}</div>}
              <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
                {user?.auth_provider === 'telegram' ? '🔵 Telegram' : user?.auth_provider === 'google' ? '🔴 Google' : ''}
              </div>
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 8 }}>
              <div onClick={logout}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 11, fontSize: '0.84rem', fontWeight: 600, color: 'var(--red)', cursor: 'pointer' }}>
                🚪 Вийти
              </div>
            </div>
          </div>

          {/* Основне */}
          <div>
            {/* Особисті дані */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 24, marginBottom: 14 }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 18 }}>Особиста інформація</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                {[
                  ["Ім'я та прізвище", 'display_name', 'text', 'Данило Молодорич'],
                  ['Нікнейм',          'username',     'text', 'danioooooo'],
                  ['Дата народження',   'birth_date',   'date', ''],
                ].map(([label, key, type, placeholder]) => (
                  <div key={key} style={key === 'birth_date' ? { gridColumn: '1/-1' } : {}}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--muted)', marginBottom: 5 }}>{label}</div>
                    <input type={type} value={form[key]} placeholder={placeholder}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 12, padding: '10px 14px', color: 'var(--text)', fontFamily: 'Nunito, sans-serif', fontSize: '0.86rem', outline: 'none' }} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ minWidth: 120 }}>
                  {saving ? 'Зберігаємо...' : saved ? '✓ Збережено' : 'Зберегти'}
                </button>
              </div>
            </div>

            {/* Сповіщення */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 24, marginBottom: 14 }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 14 }}>Сповіщення Telegram</div>
              {[
                ['birthdays',    '🔔 Дні народження', 'За 1, 3 і 7 днів до події'],
                ['reservations', '🎁 Резервування',   'Коли друг обрав твій товар'],
                ['friends',      '👥 Нові друзі',     'Push та Telegram-повідомлення'],
                ['events',       '📢 Активність',     'Нові учасники та зміни подій'],
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

            {/* Небезпечна зона */}
            <div style={{ background: 'var(--surface)', border: '1px solid rgba(240,91,91,0.2)', borderRadius: 20, padding: 24, marginBottom: 60 }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 14 }}>Небезпечна зона</div>
              <button onClick={logout}
                style={{ width: '100%', background: 'rgba(240,91,91,0.07)', border: '1px solid rgba(240,91,91,0.2)', borderRadius: 12, padding: 12, color: 'var(--red)', fontFamily: 'Nunito, sans-serif', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer' }}>
                🚪 Вийти з акаунту
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
      <style>{`@media (max-width: 768px) { .account-layout { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  )
}
