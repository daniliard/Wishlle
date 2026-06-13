import { useState, useEffect } from 'react'
import Footer from '../components/Footer'
import { getMyEvents, createEvent } from '../api/client'

const TYPE_LABELS = { birthday: '🎂 День народження', group: '🎉 Групова подія', private: '🔒 Приватна подія' }
const TYPE_COLORS = {
  birthday: 'rgba(247,162,57,0.12)',
  group:    'rgba(0,200,232,0.1)',
  private:  'rgba(167,139,250,0.12)',
}
const MONTHS_UA = ['Січень','Лютий','Березень','Квітень','Травень','Червень','Липень','Серпень','Вересень','Жовтень','Листопад','Грудень']

function daysUntil(dateStr) {
  const today = new Date(); today.setHours(0,0,0,0)
  const d = new Date(dateStr); d.setHours(0,0,0,0)
  return Math.round((d - today) / 86400000)
}

function EventModal({ onClose, onSave }) {
  const [form, setForm] = useState({ title: '', event_date: '', event_type: 'birthday' })
  const [saving, setSaving] = useState(false)

  async function handleSubmit() {
    if (!form.title.trim() || !form.event_date) return
    setSaving(true)
    try { await onSave(form) } finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#0f1e2e', border: '1px solid var(--border2)', borderRadius: 22, padding: 28, width: '100%', maxWidth: 380 }}>
        <div style={{ fontWeight: 900, fontSize: '1.1rem', marginBottom: 22 }}>Нова подія</div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--muted)', marginBottom: 6 }}>Тип</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {Object.entries(TYPE_LABELS).map(([v, l]) => (
              <div key={v} onClick={() => setForm(f => ({ ...f, event_type: v }))}
                style={{ padding: '9px 14px', borderRadius: 11, border: `1px solid ${form.event_type === v ? 'rgba(0,200,232,0.4)' : 'var(--border)'}`, background: form.event_type === v ? 'var(--cyan-glow)' : 'var(--surface)', color: form.event_type === v ? 'var(--cyan)' : 'var(--muted)', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>
                {l}
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--muted)', marginBottom: 6 }}>Назва</div>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Наприклад: ДН Дані"
            style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 12, padding: '11px 14px', color: 'var(--text)', fontFamily: 'Nunito, sans-serif', fontSize: '0.9rem', outline: 'none' }} />
        </div>

        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--muted)', marginBottom: 6 }}>Дата</div>
          <input type="date" value={form.event_date} onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))}
            style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 12, padding: '11px 14px', color: 'var(--text)', fontFamily: 'Nunito, sans-serif', fontSize: '0.9rem', outline: 'none' }} />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-outline" style={{ flex: 1 }} onClick={onClose}>Скасувати</button>
          <button className="btn-primary" style={{ flex: 1 }} onClick={handleSubmit} disabled={saving}>
            {saving ? '...' : 'Створити'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Events() {
  const [events, setEvents]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter]       = useState(0)
  const [calMonth, setCalMonth]   = useState(new Date())

  const FILTERS = ['Всі', 'Дні народження', 'Групові', 'Приватні']

  useEffect(() => { loadEvents() }, [])

  async function loadEvents() {
    setLoading(true)
    try {
      const data = await getMyEvents()
      setEvents(Array.isArray(data) ? data : [])
    } catch { setEvents([]) }
    finally { setLoading(false) }
  }

  async function handleSave(form) {
    await createEvent(form)
    setShowModal(false)
    loadEvents()
  }

  const filtered = events.filter(ev => {
    if (filter === 1) return ev.event_type === 'birthday'
    if (filter === 2) return ev.event_type === 'group'
    if (filter === 3) return ev.event_type === 'private'
    return true
  }).map(ev => ({ ...ev, daysLeft: ev.event_date ? daysUntil(ev.event_date) : null }))
    .sort((a, b) => (a.daysLeft ?? 9999) - (b.daysLeft ?? 9999))

  // Calendar
  const year  = calMonth.getFullYear()
  const month = calMonth.getMonth()
  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7 // Mon=0
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const eventDates  = new Set(events.filter(e => e.event_date).map(e => new Date(e.event_date).getDate() + '-' + (new Date(e.event_date).getMonth())))
  const today = new Date()

  return (
    <div className="anim-fade-up">
      <div className="wrap">
        <div className="content-toolbar">
          <div>
            <strong>{filtered.length} майбутніх подій</strong>
            <span>Дні народження, приватні та групові зустрічі</span>
          </div>
          <button className="btn-primary" onClick={() => setShowModal(true)}>＋ Нова подія</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, paddingTop: 36, alignItems: 'start' }} className="events-layout">
          {/* Список */}
          <div>
            <div className="pills">
              {FILTERS.map((f, i) => (
                <div key={f} className={`pill ${filter === i ? 'active' : ''}`} onClick={() => setFilter(i)}>{f}</div>
              ))}
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>Завантаження...</div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
                <div style={{ fontSize: '3rem', marginBottom: 12 }}>🗓️</div>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Немає подій</div>
                <button className="btn-primary" style={{ marginTop: 8 }} onClick={() => setShowModal(true)}>＋ Додати подію</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 60 }}>
                {filtered.map(ev => {
                  const d = ev.daysLeft
                  const urgency = d === null ? 'far' : d <= 1 ? 'urgent' : d <= 7 ? 'normal' : 'far'
                  return (
                    <div key={ev.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', transition: 'all 0.2s' }}>
                      <div style={{ width: 50, height: 50, borderRadius: 14, background: TYPE_COLORS[ev.event_type] || 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
                        {ev.event_type === 'birthday' ? '🎂' : ev.event_type === 'private' ? '🔒' : '🎉'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: '0.92rem', marginBottom: 3 }}>{ev.title}</div>
                        <div style={{ fontSize: '0.73rem', color: 'var(--muted)' }}>
                          {ev.event_date ? new Date(ev.event_date).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                        </div>
                      </div>
                      {d !== null && (
                        <div style={{ fontSize: '0.76rem', fontWeight: 800, padding: '4px 12px', borderRadius: 8, whiteSpace: 'nowrap',
                          background: urgency === 'urgent' ? 'rgba(240,91,91,0.12)' : urgency === 'far' ? 'var(--surface2)' : 'rgba(0,200,232,0.1)',
                          color: urgency === 'urgent' ? 'var(--red)' : urgency === 'far' ? 'var(--muted)' : 'var(--cyan)',
                        }}>
                          {d === 0 ? 'Сьогодні 🔥' : d === 1 ? 'Завтра 🔥' : `${d} днів`}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Календар */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 20, position: 'sticky', top: 84 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <button className="btn-sm" onClick={() => setCalMonth(new Date(year, month - 1))}>‹</button>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--muted)' }}>{MONTHS_UA[month]} {year}</span>
              <button className="btn-sm" onClick={() => setCalMonth(new Date(year, month + 1))}>›</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, textAlign: 'center' }}>
              {['Пн','Вт','Ср','Чт','Пт','Сб','Нд'].map(d => (
                <div key={d} style={{ fontSize: '0.6rem', color: 'var(--muted)', fontWeight: 700, padding: '3px 0' }}>{d}</div>
              ))}
              {Array.from({ length: firstDay }, (_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1
                const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
                const hasEvent = eventDates.has(`${day}-${month}`)
                return (
                  <div key={day} style={{
                    fontSize: '0.74rem', padding: '6px 3px', borderRadius: 8, cursor: 'pointer',
                    background: isToday ? 'var(--cyan)' : 'transparent',
                    color: isToday ? 'var(--bg)' : hasEvent ? 'var(--cyan)' : 'rgba(255,255,255,0.65)',
                    fontWeight: isToday || hasEvent ? 900 : 400,
                    position: 'relative',
                  }}>
                    {day}
                    {hasEvent && !isToday && <div style={{ position: 'absolute', bottom: 1, left: '50%', transform: 'translateX(-50%)', width: 4, height: 4, borderRadius: '50%', background: 'var(--cyan)' }} />}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
        <Footer />
      </div>

      {showModal && <EventModal onClose={() => setShowModal(false)} onSave={handleSave} />}

      <style>{`@media (max-width: 768px) { .events-layout { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  )
}
