import { useState, useEffect } from 'react'
import Footer from '../components/Footer'
import { getMyEvents, createEvent } from '../api/client'
import { useLanguage } from '../i18n/LanguageContext'

const TYPE_COLORS = { birthday: 'rgba(247,162,57,0.12)', group: 'rgba(0,200,232,0.1)', private: 'rgba(167,139,250,0.12)' }

function daysUntil(dateStr) {
  const today = new Date(); today.setHours(0,0,0,0)
  const d = new Date(dateStr); d.setHours(0,0,0,0)
  return Math.round((d - today) / 86400000)
}

function EventModal({ onClose, onSave }) {
  const { tr } = useLanguage()
  const [form, setForm] = useState({ title: '', event_date: '', event_type: 'birthday' })
  const [saving, setSaving] = useState(false)
  const typeLabels = {
    birthday: `🎂 ${tr('День народження', 'Birthday')}`,
    group: `🎉 ${tr('Групова подія', 'Group event')}`,
    private: `🔒 ${tr('Приватна подія', 'Private event')}`,
  }

  async function handleSubmit() {
    if (!form.title.trim() || !form.event_date) return
    setSaving(true)
    try { await onSave(form) } finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#0f1e2e', border: '1px solid var(--border2)', borderRadius: 22, padding: 28, width: '100%', maxWidth: 380 }}>
        <div style={{ fontWeight: 900, fontSize: '1.1rem', marginBottom: 22 }}>{tr('Нова подія', 'New event')}</div>
        <div style={{ marginBottom: 14 }}><div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--muted)', marginBottom: 6 }}>{tr('Тип', 'Type')}</div><div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{Object.entries(typeLabels).map(([v, l]) => <div key={v} onClick={() => setForm(f => ({ ...f, event_type: v }))} style={{ padding: '9px 14px', borderRadius: 11, border: `1px solid ${form.event_type === v ? 'rgba(0,200,232,0.4)' : 'var(--border)'}`, background: form.event_type === v ? 'var(--cyan-glow)' : 'var(--surface)', color: form.event_type === v ? 'var(--cyan)' : 'var(--muted)', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>{l}</div>)}</div></div>
        <div style={{ marginBottom: 14 }}><div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--muted)', marginBottom: 6 }}>{tr('Назва', 'Title')}</div><input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder={tr('Наприклад: День народження Дані', 'For example: Dan’s birthday')} style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 12, padding: '11px 14px', color: 'var(--text)', fontFamily: 'Nunito, sans-serif', fontSize: '0.9rem', outline: 'none' }} /></div>
        <div style={{ marginBottom: 22 }}><div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--muted)', marginBottom: 6 }}>{tr('Дата', 'Date')}</div><input type="date" value={form.event_date} onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))} style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 12, padding: '11px 14px', color: 'var(--text)', fontFamily: 'Nunito, sans-serif', fontSize: '0.9rem', outline: 'none' }} /></div>
        <div style={{ display: 'flex', gap: 10 }}><button className="btn-outline" style={{ flex: 1 }} onClick={onClose}>{tr('Скасувати', 'Cancel')}</button><button className="btn-primary" style={{ flex: 1 }} onClick={handleSubmit} disabled={saving}>{saving ? '...' : tr('Створити', 'Create')}</button></div>
      </div>
    </div>
  )
}

export default function Events() {
  const { tr, locale, language } = useLanguage()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState(0)
  const [calMonth, setCalMonth] = useState(new Date())

  const filters = [tr('Всі', 'All'), tr('Дні народження', 'Birthdays'), tr('Групові', 'Group'), tr('Приватні', 'Private')]
  const months = language === 'en'
    ? ['January','February','March','April','May','June','July','August','September','October','November','December']
    : ['Січень','Лютий','Березень','Квітень','Травень','Червень','Липень','Серпень','Вересень','Жовтень','Листопад','Грудень']
  const weekdays = language === 'en' ? ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] : ['Пн','Вт','Ср','Чт','Пт','Сб','Нд']

  useEffect(() => { loadEvents() }, [])
  async function loadEvents() { setLoading(true); try { const data = await getMyEvents(); setEvents(Array.isArray(data) ? data : []) } catch { setEvents([]) } finally { setLoading(false) } }
  async function handleSave(form) { await createEvent(form); setShowModal(false); loadEvents() }

  const filtered = events.filter(ev => filter === 0 || (filter === 1 && ev.event_type === 'birthday') || (filter === 2 && ev.event_type === 'group') || (filter === 3 && ev.event_type === 'private')).map(ev => ({ ...ev, daysLeft: ev.event_date ? daysUntil(ev.event_date) : null })).sort((a, b) => (a.daysLeft ?? 9999) - (b.daysLeft ?? 9999))
  const year = calMonth.getFullYear(); const month = calMonth.getMonth(); const firstDay = (new Date(year, month, 1).getDay() + 6) % 7; const daysInMonth = new Date(year, month + 1, 0).getDate()
  const eventDates = new Set(events.filter(e => e.event_date).map(e => `${new Date(e.event_date).getDate()}-${new Date(e.event_date).getMonth()}`))
  const today = new Date()
  const formatCountdown = d => d === 0 ? tr('Сьогодні 🔥', 'Today 🔥') : d === 1 ? tr('Завтра 🔥', 'Tomorrow 🔥') : tr(`${d} днів`, `${d} days`)

  return (
    <div className="anim-fade-up"><div className="wrap">
      <div className="content-toolbar"><div><strong>{filtered.length} {tr('майбутніх подій', 'upcoming events')}</strong><span>{tr('Дні народження, приватні та групові зустрічі', 'Birthdays, private and group gatherings')}</span></div><button className="btn-primary" onClick={() => setShowModal(true)}>＋ {tr('Нова подія', 'New event')}</button></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, paddingTop: 36, alignItems: 'start' }} className="events-layout">
        <div><div className="pills">{filters.map((f, i) => <div key={f} className={`pill ${filter === i ? 'active' : ''}`} onClick={() => setFilter(i)}>{f}</div>)}</div>
          {loading ? <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>{tr('Завантаження...', 'Loading...')}</div> : filtered.length === 0 ? <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}><div style={{ fontSize: '3rem', marginBottom: 12 }}>🗓️</div><div style={{ fontWeight: 700, marginBottom: 8 }}>{tr('Немає подій', 'No events')}</div><button className="btn-primary" style={{ marginTop: 8 }} onClick={() => setShowModal(true)}>＋ {tr('Додати подію', 'Add event')}</button></div> : <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 60 }}>{filtered.map(ev => {
            const d = ev.daysLeft; const urgency = d === null ? 'far' : d <= 1 ? 'urgent' : d <= 7 ? 'normal' : 'far'
            return <div key={ev.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', transition: 'all 0.2s' }}><div style={{ width: 50, height: 50, borderRadius: 14, background: TYPE_COLORS[ev.event_type] || 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>{ev.event_type === 'birthday' ? '🎂' : ev.event_type === 'private' ? '🔒' : '🎉'}</div><div style={{ flex: 1 }}><div style={{ fontWeight: 800, fontSize: '0.92rem', marginBottom: 3 }}>{ev.title}</div><div style={{ fontSize: '0.73rem', color: 'var(--muted)' }}>{ev.event_date ? new Date(ev.event_date).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }) : ''}</div></div>{d !== null && <div style={{ fontSize: '0.76rem', fontWeight: 800, padding: '4px 12px', borderRadius: 8, whiteSpace: 'nowrap', background: urgency === 'urgent' ? 'rgba(240,91,91,0.12)' : urgency === 'far' ? 'var(--surface2)' : 'rgba(0,200,232,0.1)', color: urgency === 'urgent' ? 'var(--red)' : urgency === 'far' ? 'var(--muted)' : 'var(--cyan)' }}>{formatCountdown(d)}</div>}</div>
          })}</div>}
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 20, position: 'sticky', top: 84 }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}><button className="btn-sm" onClick={() => setCalMonth(new Date(year, month - 1))}>‹</button><span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--muted)' }}>{months[month]} {year}</span><button className="btn-sm" onClick={() => setCalMonth(new Date(year, month + 1))}>›</button></div><div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, textAlign: 'center' }}>{weekdays.map(d => <div key={d} style={{ fontSize: '0.6rem', color: 'var(--muted)', fontWeight: 700, padding: '3px 0' }}>{d}</div>)}{Array.from({ length: firstDay }, (_, i) => <div key={`e${i}`} />)}{Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1; const hasEvent = eventDates.has(`${day}-${month}`); const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year
          return <div key={day} style={{ position: 'relative', padding: '6px 0', fontSize: '0.7rem', borderRadius: 8, background: isToday ? 'var(--cyan)' : hasEvent ? 'var(--cyan-glow)' : 'transparent', color: isToday ? '#00141f' : hasEvent ? 'var(--cyan)' : 'var(--muted)', fontWeight: isToday || hasEvent ? 800 : 400 }}>{day}{hasEvent && !isToday && <span style={{ position: 'absolute', bottom: 1, left: '50%', transform: 'translateX(-50%)', width: 4, height: 4, borderRadius: '50%', background: 'var(--cyan)' }} />}</div>
        })}</div></div>
      </div><Footer /></div>{showModal && <EventModal onClose={() => setShowModal(false)} onSave={handleSave} />}<style>{`@media (max-width: 768px) { .events-layout { grid-template-columns: 1fr !important; } }`}</style></div>
  )
}
