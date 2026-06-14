import { useState, useEffect, useMemo } from 'react'
import Footer from '../components/Footer'
import AppIcon from '../components/AppIcons'
import {
  getMyEvents, getEventDetails, createEvent, updateEvent, deleteEvent,
  inviteToEvent, respondToEvent, removeEventParticipant, syncBirthdayEvents,
  getFriends, getUserId,
} from '../api/client'
import { useLanguage } from '../i18n/LanguageContext'
import s from './Events.module.css'

function daysUntil(dateStr) {
  if (!dateStr) return null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const d = new Date(dateStr); d.setHours(0, 0, 0, 0)
  return Math.round((d - today) / 86400000)
}

function initials(user) {
  const src = user?.display_name || user?.username || 'W'
  return src.split(/\s+/).filter(Boolean).map(p => p[0]).join('').slice(0, 2).toUpperCase()
}

function Avatar({ user, size = 36 }) {
  return (
    <div className={s.avatar} style={{ width: size, height: size, flexBasis: size, fontSize: size * 0.32 }}>
      {user?.avatar_url ? <img src={user.avatar_url} alt="" /> : <span>{initials(user)}</span>}
    </div>
  )
}

function Modal({ children, onClose, wide }) {
  return (
    <div className={s.backdrop} onMouseDown={onClose}>
      <div className={`${s.modal} ${wide ? s.modalWide : ''}`} onMouseDown={e => e.stopPropagation()}>{children}</div>
    </div>
  )
}

const TYPE_META = {
  private: { icon: '🔒', glow: 'rgba(167,139,250,0.14)' },
  group:   { icon: '🎉', glow: 'rgba(0,200,232,0.12)' },
}

export default function Events() {
  const { tr, locale, language } = useLanguage()
  const myId = getUserId()

  const [events, setEvents] = useState([])
  const [friends, setFriends] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState({ type: '', text: '' })

  const [filter, setFilter] = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const [calMonth, setCalMonth] = useState(new Date())

  async function load() {
    setLoading(true)
    try {
      const [ev, fr] = await Promise.all([getMyEvents(), getFriends().catch(() => [])])
      setEvents(Array.isArray(ev) ? ev : [])
      setFriends(Array.isArray(fr) ? fr : [])
    } catch (e) {
      setMessage({ type: 'error', text: e?.message || tr('Не вдалося завантажити події.', 'Could not load events.') })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    return events
      .filter(ev => filter === 'all'
        || (filter === 'private' && ev.event_type === 'private')
        || (filter === 'group' && ev.event_type === 'group')
        || (filter === 'invited' && !ev.is_owner))
      .map(ev => ({ ...ev, daysLeft: daysUntil(ev.event_date) }))
      .sort((a, b) => (a.daysLeft ?? 99999) - (b.daysLeft ?? 99999))
  }, [events, filter])

  const pendingInvites = events.filter(ev => !ev.is_owner && ev.my_status === 'invited').length

  async function handleCreate(payload) {
    setBusy(true)
    try {
      await createEvent(payload)
      setShowCreate(false)
      setMessage({ type: 'success', text: tr('Подію створено 🎉', 'Event created 🎉') })
      await load()
    } catch (e) {
      setMessage({ type: 'error', text: e?.message || tr('Не вдалося створити подію.', 'Could not create event.') })
    } finally {
      setBusy(false)
    }
  }

  async function openDetail(eventId) {
    setDetailLoading(true)
    setMessage({ type: '', text: '' })
    try {
      const data = await getEventDetails(eventId)
      setDetail(data)
    } catch (e) {
      setMessage({ type: 'error', text: e?.message || tr('Не вдалося відкрити подію.', 'Could not open event.') })
    } finally {
      setDetailLoading(false)
    }
  }

  async function refreshDetail() {
    if (!detail) return
    try { setDetail(await getEventDetails(detail.id)) } catch { /* ignore */ }
  }

  async function handleRespond(st) {
    if (!detail) return
    setBusy(true)
    try {
      await respondToEvent(detail.id, st)
      await refreshDetail()
      await load()
      setMessage({ type: 'success', text: st === 'accepted' ? tr('Ви прийняли запрошення.', 'Invitation accepted.') : tr('Ви відхилили запрошення.', 'Invitation declined.') })
    } catch (e) {
      setMessage({ type: 'error', text: e?.message || tr('Помилка.', 'Error.') })
    } finally {
      setBusy(false)
    }
  }

  async function handleInvite(userIds) {
    if (!detail || userIds.length === 0) return
    setBusy(true)
    try {
      const updated = await inviteToEvent(detail.id, userIds)
      setDetail(updated)
      await load()
      setMessage({ type: 'success', text: tr('Запрошення надіслано.', 'Invitations sent.') })
    } catch (e) {
      setMessage({ type: 'error', text: e?.message || tr('Не вдалося запросити.', 'Could not invite.') })
    } finally {
      setBusy(false)
    }
  }

  async function handleRemoveParticipant(participantUserId) {
    if (!detail) return
    setBusy(true)
    try {
      await removeEventParticipant(detail.id, participantUserId)
      await refreshDetail()
      await load()
    } catch (e) {
      setMessage({ type: 'error', text: e?.message || tr('Помилка.', 'Error.') })
    } finally {
      setBusy(false)
    }
  }

  async function handleDeleteEvent() {
    if (!detail) return
    if (!window.confirm(tr('Видалити цю подію?', 'Delete this event?'))) return
    setBusy(true)
    try {
      await deleteEvent(detail.id)
      setDetail(null)
      await load()
      setMessage({ type: 'success', text: tr('Подію видалено.', 'Event deleted.') })
    } catch (e) {
      setMessage({ type: 'error', text: e?.message || tr('Помилка.', 'Error.') })
    } finally {
      setBusy(false)
    }
  }

  async function handleSyncBirthdays() {
    setSyncing(true)
    try {
      const created = await syncBirthdayEvents()
      await load()
      const n = Array.isArray(created) ? created.length : 0
      setMessage({ type: 'success', text: n > 0 ? tr(`Створено подій ДН: ${n}`, `Birthday events created: ${n}`) : tr('Нових днів народження немає.', 'No new birthdays.') })
    } catch (e) {
      setMessage({ type: 'error', text: e?.message || tr('Не вдалося синхронізувати.', 'Could not sync.') })
    } finally {
      setSyncing(false)
    }
  }

  // Календар
  const year = calMonth.getFullYear(), month = calMonth.getMonth()
  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const eventDates = new Set(events.filter(e => e.event_date).map(e => `${new Date(e.event_date).getDate()}-${new Date(e.event_date).getMonth()}`))
  const today = new Date()
  const months = language === 'en'
    ? ['January','February','March','April','May','June','July','August','September','October','November','December']
    : ['Січень','Лютий','Березень','Квітень','Травень','Червень','Липень','Серпень','Вересень','Жовтень','Листопад','Грудень']
  const weekdays = language === 'en' ? ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] : ['Пн','Вт','Ср','Чт','Пт','Сб','Нд']

  const countdown = d => d === null ? '' : d < 0 ? tr('Минула', 'Past') : d === 0 ? tr('Сьогодні 🔥', 'Today 🔥') : d === 1 ? tr('Завтра 🔥', 'Tomorrow 🔥') : tr(`${d} дн.`, `${d} days`)

  const filters = [
    { id: 'all', label: tr('Усі', 'All') },
    { id: 'private', label: tr('Приватні', 'Private') },
    { id: 'group', label: tr('Групові', 'Group') },
    { id: 'invited', label: tr('Запрошення', 'Invites') },
  ]

  return (
    <div className="anim-fade-up">
      <div className="wrap">
        <section className={s.pageHero}>
          <div>
            <span>{tr('КАЛЕНДАР ПОДІЙ', 'EVENT CALENDAR')}</span>
            <h1>{tr('Події', 'Events')}</h1>
            <p>{tr('Приватні дні народження та групові зустрічі. Запрошуй друзів і дивись їхні списки побажань.', 'Private birthdays and group gatherings. Invite friends and see their wishlists.')}</p>
          </div>
          <div className={s.heroActions}>
            <button className="btn-outline" onClick={handleSyncBirthdays} disabled={syncing}>
              🎂 {syncing ? tr('Синхронізуємо…', 'Syncing…') : tr('Дні народження друзів', 'Friends’ birthdays')}
            </button>
            <button className="btn-primary" onClick={() => setShowCreate(true)}><AppIcon name="plus" size={15} /> {tr('Нова подія', 'New event')}</button>
          </div>
        </section>

        {message.text && (
          <div className={`${s.notice} ${message.type === 'error' ? s.noticeError : s.noticeSuccess}`}>
            <span>{message.text}</span>
            <button onClick={() => setMessage({ type: '', text: '' })}>×</button>
          </div>
        )}

        <div className={s.layout}>
          <div>
            <div className={s.filters}>
              {filters.map(f => (
                <button key={f.id} className={filter === f.id ? s.filterActive : ''} onClick={() => setFilter(f.id)}>
                  {f.label}
                  {f.id === 'invited' && pendingInvites > 0 && <b className={s.badge}>{pendingInvites}</b>}
                </button>
              ))}
            </div>

            {loading ? (
              <div className={s.loading}><div className="auth-spinner" />{tr('Завантажуємо події…', 'Loading events…')}</div>
            ) : filtered.length === 0 ? (
              <div className={s.empty}>
                <div>🗓️</div>
                <h2>{tr('Подій поки немає', 'No events yet')}</h2>
                <p>{tr('Створи приватну подію для друга або групову зустріч.', 'Create a private event for a friend or a group gathering.')}</p>
                <button className="btn-primary" onClick={() => setShowCreate(true)}><AppIcon name="plus" size={15} /> {tr('Створити подію', 'Create event')}</button>
              </div>
            ) : (
              <div className={s.eventList}>
                {filtered.map(ev => {
                  const meta = TYPE_META[ev.event_type] || TYPE_META.group
                  const d = ev.daysLeft
                  const urgent = d !== null && d >= 0 && d <= 1
                  const soon = d !== null && d > 1 && d <= 7
                  return (
                    <article key={ev.id} className={s.eventCard} onClick={() => openDetail(ev.id)}>
                      <div className={s.eventIcon} style={{ background: meta.glow }}>{meta.icon}</div>
                      <div className={s.eventBody}>
                        <div className={s.eventTitleRow}>
                          <h3>{ev.title}</h3>
                          {ev.is_auto && <span className={s.autoTag}>{tr('авто', 'auto')}</span>}
                          {!ev.is_owner && <span className={s.invitedTag}>{tr('запрошення', 'invited')}</span>}
                        </div>
                        <div className={s.eventMeta}>
                          <span>{ev.event_date ? new Date(ev.event_date).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }) : ''}</span>
                          {ev.location && <span>· 📍 {ev.location}</span>}
                          <span>· 👥 {ev.participants_count}</span>
                          <span className={s.typeBadge}>{ev.event_type === 'private' ? tr('Приватна', 'Private') : tr('Групова', 'Group')}</span>
                        </div>
                      </div>
                      {d !== null && (
                        <div className={`${s.countdown} ${urgent ? s.cdUrgent : soon ? s.cdSoon : ''}`}>{countdown(d)}</div>
                      )}
                    </article>
                  )
                })}
              </div>
            )}
          </div>

          {/* Календар */}
          <aside className={s.calendar}>
            <div className={s.calHead}>
              <button onClick={() => setCalMonth(new Date(year, month - 1))}>‹</button>
              <span>{months[month]} {year}</span>
              <button onClick={() => setCalMonth(new Date(year, month + 1))}>›</button>
            </div>
            <div className={s.calGrid}>
              {weekdays.map(d => <div key={d} className={s.calWeekday}>{d}</div>)}
              {Array.from({ length: firstDay }, (_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1
                const has = eventDates.has(`${day}-${month}`)
                const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year
                return (
                  <div key={day} className={`${s.calDay} ${isToday ? s.calToday : ''} ${has ? s.calHasEvent : ''}`}>
                    {day}{has && !isToday && <i />}
                  </div>
                )
              })}
            </div>
          </aside>
        </div>

        <Footer />
      </div>

      {showCreate && (
        <CreateEventModal
          friends={friends}
          busy={busy}
          tr={tr}
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}

      {detail && (
        <EventDetailModal
          detail={detail}
          friends={friends}
          myId={myId}
          busy={busy}
          tr={tr}
          locale={locale}
          onClose={() => setDetail(null)}
          onRespond={handleRespond}
          onInvite={handleInvite}
          onRemoveParticipant={handleRemoveParticipant}
          onDelete={handleDeleteEvent}
        />
      )}
    </div>
  )
}

// ── Модалка створення ──────────────────────────────────────────────────────
function CreateEventModal({ friends, busy, tr, onClose, onCreate }) {
  const [form, setForm] = useState({
    title: '', description: '', event_date: '', location: '',
    event_type: 'private', honoree_id: '',
  })
  const [selectedParticipants, setSelectedParticipants] = useState([])

  function toggleParticipant(fid) {
    setSelectedParticipants(cur => cur.includes(fid) ? cur.filter(x => x !== fid) : [...cur, fid])
  }

  function submit() {
    if (!form.title.trim() || !form.event_date) return
    if (form.event_type === 'private' && !form.honoree_id) return

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      event_date: form.event_date,
      location: form.location.trim() || null,
      event_type: form.event_type,
      honoree_id: form.event_type === 'private' ? form.honoree_id : null,
      participant_ids: selectedParticipants,
    }
    onCreate(payload)
  }

  return (
    <Modal onClose={() => !busy && onClose()} wide>
      <div className={s.modalHead}>
        <div>
          <span>{tr('НОВА ПОДІЯ', 'NEW EVENT')}</span>
          <h2>{tr('Створити подію', 'Create event')}</h2>
        </div>
        <button onClick={onClose}><AppIcon name="close" size={18} /></button>
      </div>

      <div className={s.typeSwitch}>
        <button className={form.event_type === 'private' ? s.typeActive : ''} onClick={() => setForm(f => ({ ...f, event_type: 'private' }))}>
          🔒 {tr('Приватна', 'Private')}
          <small>{tr('День народження одного іменинника', 'A birthday for one honoree')}</small>
        </button>
        <button className={form.event_type === 'group' ? s.typeActive : ''} onClick={() => setForm(f => ({ ...f, event_type: 'group', honoree_id: '' }))}>
          🎉 {tr('Групова', 'Group')}
          <small>{tr('Усі учасники рівні, бачать списки одне одного', 'Equal participants, shared wishlists')}</small>
        </button>
      </div>

      <label className={s.field}>
        <span>{tr('Назва події', 'Event title')}</span>
        <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} maxLength={120} placeholder={tr('Наприклад, День народження Дані', 'For example, Dan’s birthday')} />
      </label>

      {form.event_type === 'private' && (
        <div className={s.field}>
          <span>{tr('Іменинник', 'Honoree')}</span>
          {friends.length === 0 ? (
            <p className={s.hint}>{tr('Спершу додай друзів, щоб обрати іменинника.', 'Add friends first to pick an honoree.')}</p>
          ) : (
            <div className={s.honoreePicker}>
              {friends.map(fr => {
                const u = fr.user || {}
                const active = form.honoree_id === fr.friend_id
                return (
                  <button key={fr.id} className={active ? s.honoreeActive : ''} onClick={() => setForm(f => ({ ...f, honoree_id: fr.friend_id }))}>
                    <Avatar user={u} size={30} />
                    <span>{fr.nickname || u.display_name || u.username}</span>
                    {active && <AppIcon name="check" size={14} />}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      <div className={s.row2}>
        <label className={s.field}>
          <span>{tr('Дата', 'Date')}</span>
          <input type="date" value={form.event_date} onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))} />
        </label>
        <label className={s.field}>
          <span>{tr('Місце (необов’язково)', 'Location (optional)')}</span>
          <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} maxLength={255} placeholder={tr('Кафе, дім, …', 'Cafe, home, …')} />
        </label>
      </div>

      <label className={s.field}>
        <span>{tr('Опис (необов’язково)', 'Description (optional)')}</span>
        <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder={tr('Деталі події…', 'Event details…')} />
      </label>

      <div className={s.field}>
        <span>{tr('Запросити друзів', 'Invite friends')} {selectedParticipants.length > 0 && `· ${selectedParticipants.length}`}</span>
        {friends.length === 0 ? (
          <p className={s.hint}>{tr('Немає друзів для запрошення.', 'No friends to invite.')}</p>
        ) : (
          <div className={s.inviteGrid}>
            {friends.filter(fr => fr.friend_id !== form.honoree_id).map(fr => {
              const u = fr.user || {}
              const active = selectedParticipants.includes(fr.friend_id)
              return (
                <button key={fr.id} className={active ? s.inviteActive : ''} onClick={() => toggleParticipant(fr.friend_id)}>
                  <Avatar user={u} size={28} />
                  <span>{fr.nickname || u.display_name || u.username}</span>
                  {active && <AppIcon name="check" size={13} />}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className={s.modalActions}>
        <button className="btn-outline" onClick={onClose} disabled={busy}>{tr('Скасувати', 'Cancel')}</button>
        <button className="btn-primary" onClick={submit} disabled={busy || !form.title.trim() || !form.event_date || (form.event_type === 'private' && !form.honoree_id)}>
          {busy ? tr('Створюємо…', 'Creating…') : tr('Створити подію', 'Create event')}
        </button>
      </div>
    </Modal>
  )
}

// ── Модалка деталей ────────────────────────────────────────────────────────
function EventDetailModal({ detail, friends, myId, busy, tr, locale, onClose, onRespond, onInvite, onRemoveParticipant, onDelete }) {
  const [inviteOpen, setInviteOpen] = useState(false)
  const [toInvite, setToInvite] = useState([])

  const meta = TYPE_META[detail.event_type] || TYPE_META.group
  const d = daysUntil(detail.event_date)
  const honoree = detail.participants.find(p => p.role === 'honoree')

  const participantUserIds = new Set(detail.participants.map(p => p.user_id))
  const invitableFriends = friends.filter(fr => !participantUserIds.has(fr.friend_id))

  function toggleInvite(fid) {
    setToInvite(cur => cur.includes(fid) ? cur.filter(x => x !== fid) : [...cur, fid])
  }

  function sendInvites() {
    onInvite(toInvite)
    setToInvite([])
    setInviteOpen(false)
  }

  const statusLabel = st => st === 'accepted' ? tr('Прийняв', 'Accepted') : st === 'declined' ? tr('Відхилив', 'Declined') : tr('Запрошено', 'Invited')

  return (
    <Modal onClose={onClose} wide>
      <div className={s.modalHead}>
        <div>
          <span>{detail.event_type === 'private' ? tr('ПРИВАТНА ПОДІЯ', 'PRIVATE EVENT') : tr('ГРУПОВА ПОДІЯ', 'GROUP EVENT')}</span>
          <h2>{meta.icon} {detail.title}</h2>
          <p>
            {detail.event_date ? new Date(detail.event_date).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : ''}
            {d !== null && d >= 0 && ` · ${d === 0 ? tr('сьогодні', 'today') : d === 1 ? tr('завтра', 'tomorrow') : tr(`через ${d} дн.`, `in ${d} days`)}`}
          </p>
        </div>
        <button onClick={onClose}><AppIcon name="close" size={18} /></button>
      </div>

      {detail.description && <p className={s.detailDesc}>{detail.description}</p>}
      {detail.location && <p className={s.detailLoc}>📍 {detail.location}</p>}

      {/* Запрошення для поточного користувача */}
      {!detail.is_owner && detail.my_status === 'invited' && (
        <div className={s.inviteBanner}>
          <span>{tr('Вас запрошено на цю подію. Прийняти участь?', 'You are invited to this event. Will you join?')}</span>
          <div>
            <button className={s.declineBtn} onClick={() => onRespond('declined')} disabled={busy}>{tr('Відхилити', 'Decline')}</button>
            <button className={s.acceptBtn} onClick={() => onRespond('accepted')} disabled={busy}><AppIcon name="check" size={14} /> {tr('Прийняти', 'Accept')}</button>
          </div>
        </div>
      )}
      {!detail.is_owner && detail.my_status === 'accepted' && (
        <div className={s.statusBanner}>✅ {tr('Ви берете участь у події.', 'You are attending this event.')}</div>
      )}
      {!detail.is_owner && detail.my_status === 'declined' && (
        <div className={s.statusBanner}>
          {tr('Ви відхилили запрошення.', 'You declined the invitation.')}
          <button className={s.linkBtn} onClick={() => onRespond('accepted')} disabled={busy}>{tr('Передумати', 'Change my mind')}</button>
        </div>
      )}

      {/* Учасники */}
      <div className={s.sectionTitle}>
        <strong>{tr('Учасники', 'Participants')} · {detail.participants.length}</strong>
        {detail.is_owner && invitableFriends.length > 0 && (
          <button className={s.smallBtn} onClick={() => setInviteOpen(v => !v)}><AppIcon name="plus" size={13} /> {tr('Запросити', 'Invite')}</button>
        )}
      </div>

      {inviteOpen && (
        <div className={s.invitePanel}>
          <div className={s.inviteGrid}>
            {invitableFriends.map(fr => {
              const u = fr.user || {}
              const active = toInvite.includes(fr.friend_id)
              return (
                <button key={fr.id} className={active ? s.inviteActive : ''} onClick={() => toggleInvite(fr.friend_id)}>
                  <Avatar user={u} size={26} />
                  <span>{fr.nickname || u.display_name || u.username}</span>
                  {active && <AppIcon name="check" size={12} />}
                </button>
              )
            })}
          </div>
          <button className="btn-primary" disabled={toInvite.length === 0 || busy} onClick={sendInvites}>
            {tr('Надіслати запрошення', 'Send invites')} {toInvite.length > 0 && `(${toInvite.length})`}
          </button>
        </div>
      )}

      <div className={s.participantList}>
        {detail.participants.map(p => (
          <div key={p.id} className={s.participant}>
            <Avatar user={p.user} size={38} />
            <div className={s.pInfo}>
              <strong>{p.user.display_name || p.user.username || tr('Користувач', 'User')}{p.user_id === myId && ` (${tr('ви', 'you')})`}</strong>
              {p.user.username && <span>@{p.user.username}</span>}
            </div>
            <div className={s.pBadges}>
              {p.role === 'honoree' && <span className={s.honoreeBadge}>🎂 {tr('Іменинник', 'Honoree')}</span>}
              <span className={`${s.statusBadge} ${p.status === 'accepted' ? s.stAccepted : p.status === 'declined' ? s.stDeclined : s.stInvited}`}>{statusLabel(p.status)}</span>
              {detail.is_owner && p.role !== 'honoree' && (
                <button className={s.removeP} onClick={() => onRemoveParticipant(p.user_id)} disabled={busy} title={tr('Прибрати', 'Remove')}><AppIcon name="close" size={12} /></button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Списки побажань */}
      <div className={s.sectionTitle}>
        <strong>
          {detail.event_type === 'private'
            ? tr('Список побажань іменинника', 'Honoree’s wishlists')
            : tr('Списки побажань учасників', 'Participants’ wishlists')}
          {' · '}{detail.wishlists.length}
        </strong>
      </div>

      {detail.wishlists.length === 0 ? (
        <div className={s.noWishlists}>
          <span>🎁</span>
          <p>{detail.event_type === 'private'
            ? tr('Іменинник ще не має доступних списків побажань.', 'The honoree has no visible wishlists yet.')
            : tr('Учасники ще не створили списків побажань.', 'Participants have no wishlists yet.')}</p>
        </div>
      ) : (
        <div className={s.wishlistGrid}>
          {detail.wishlists.map(wl => (
            <div key={wl.id} className={s.wishlistCard}>
              <div className={s.wlCover}><span>{wl.emoji}</span></div>
              <div className={s.wlBody}>
                <h4>{wl.title}</h4>
                <p>{wl.owner_name} · {wl.items_count} {tr('бажань', 'wishes')}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {detail.is_owner && (
        <div className={s.modalActions}>
          <button className={s.dangerBtn} onClick={onDelete} disabled={busy}><AppIcon name="trash" size={15} /> {tr('Видалити подію', 'Delete event')}</button>
        </div>
      )}
    </Modal>
  )
}
