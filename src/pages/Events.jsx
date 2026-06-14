import { useEffect, useMemo, useState } from 'react'
import Footer from '../components/Footer'
import AppIcon from '../components/AppIcons'
import {
  getMyEvents,
  getEventInvitations,
  getEventDetails,
  createEvent,
  updateEvent,
  deleteEvent,
  inviteToEvent,
  respondToEvent,
  removeEventParticipant,
  syncBirthdayEvents,
  getFriends,
  getUserId,
  viewFriendList,
  reserveItem,
  cancelReservation,
} from '../api/client'
import { useLanguage } from '../i18n/LanguageContext'
import s from './Events.module.css'

const EVENT_ICONS = ['🎉', '🎂', '🎁', '🎄', '💍', '🎓', '✈️', '🏠', '🍽️', '🎮', '⭐', '📅']
const TYPE_META = {
  private: { icon: '🎂', glow: 'rgba(167,139,250,0.14)' },
  group: { icon: '🎉', glow: 'rgba(0,200,232,0.12)' },
}

function daysUntil(dateStr) {
  if (!dateStr) return null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const date = new Date(dateStr); date.setHours(0, 0, 0, 0)
  return Math.round((date - today) / 86400000)
}

function initials(user) {
  const source = user?.display_name || user?.username || 'W'
  return source.split(/\s+/).filter(Boolean).map(part => part[0]).join('').slice(0, 2).toUpperCase()
}

function Avatar({ user, size = 36 }) {
  return (
    <div className={s.avatar} style={{ width: size, height: size, flexBasis: size, fontSize: size * 0.32 }}>
      {user?.avatar_url ? <img src={user.avatar_url} alt="" /> : <span>{initials(user)}</span>}
    </div>
  )
}

function Modal({ children, onClose, wide = false, extraWide = false }) {
  return (
    <div className={s.backdrop} onMouseDown={onClose}>
      <div className={`${s.modal} ${wide ? s.modalWide : ''} ${extraWide ? s.modalExtraWide : ''}`} onMouseDown={event => event.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

function eventIcon(event) {
  const custom = String(event?.cover_image || '').trim()
  return custom || TYPE_META[event?.event_type]?.icon || '📅'
}

export default function Events() {
  const { tr, locale, language } = useLanguage()
  const myId = getUserId()

  const [events, setEvents] = useState([])
  const [invitations, setInvitations] = useState([])
  const [friends, setFriends] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [filter, setFilter] = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState(null)
  const [detail, setDetail] = useState(null)
  const [busy, setBusy] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [calMonth, setCalMonth] = useState(new Date())
  const [listView, setListView] = useState(null)
  const [listLoading, setListLoading] = useState(false)
  const [reservingId, setReservingId] = useState('')

  async function load() {
    setLoading(true)
    try {
      const [eventRows, inviteRows, friendRows] = await Promise.all([
        getMyEvents(),
        getEventInvitations(),
        getFriends().catch(() => []),
      ])
      setEvents(Array.isArray(eventRows) ? eventRows : [])
      setInvitations(Array.isArray(inviteRows) ? inviteRows : [])
      setFriends(Array.isArray(friendRows) ? friendRows : [])
    } catch (error) {
      setMessage({ type: 'error', text: error?.message || tr('Не вдалося завантажити події.', 'Could not load events.') })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    const openRequestedEvent = () => {
      const eventId = sessionStorage.getItem('wishlle:open-event-id')
      if (!eventId) return
      sessionStorage.removeItem('wishlle:open-event-id')
      openDetail(eventId)
    }
    const timer = setTimeout(openRequestedEvent, 100)
    window.addEventListener('wishlle:open-event', openRequestedEvent)
    window.addEventListener('wishlle:open-event-invite', openRequestedEvent)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('wishlle:open-event', openRequestedEvent)
      window.removeEventListener('wishlle:open-event-invite', openRequestedEvent)
    }
  }, [])

  const filtered = useMemo(() => {
    const source = filter === 'invited' ? invitations : events
    return source
      .filter(event => filter === 'all'
        || filter === 'invited'
        || (filter === 'private' && event.event_type === 'private')
        || (filter === 'group' && event.event_type === 'group'))
      .map(event => ({ ...event, daysLeft: daysUntil(event.event_date) }))
      .sort((left, right) => (left.daysLeft ?? 99999) - (right.daysLeft ?? 99999))
  }, [events, invitations, filter])

  async function handleCreate(payload) {
    setBusy(true)
    try {
      await createEvent(payload)
      setShowCreate(false)
      setMessage({ type: 'success', text: tr('Подію створено, запрошення надіслано 🎉', 'Event created and invitations sent 🎉') })
      await load()
    } catch (error) {
      setMessage({ type: 'error', text: error?.message || tr('Не вдалося створити подію.', 'Could not create event.') })
    } finally {
      setBusy(false)
    }
  }

  async function handleUpdate(payload) {
    if (!editing) return
    setBusy(true)
    try {
      await updateEvent(editing.id, payload)
      setEditing(null)
      setMessage({ type: 'success', text: tr('Подію оновлено.', 'Event updated.') })
      await load()
      if (detail?.id === editing.id) setDetail(await getEventDetails(editing.id))
    } catch (error) {
      setMessage({ type: 'error', text: error?.message || tr('Не вдалося оновити подію.', 'Could not update event.') })
    } finally {
      setBusy(false)
    }
  }

  async function openDetail(eventId) {
    try {
      setDetail(await getEventDetails(eventId))
    } catch (error) {
      setMessage({ type: 'error', text: error?.message || tr('Не вдалося відкрити подію.', 'Could not open event.') })
    }
  }

  async function refreshDetail() {
    if (!detail) return
    try { setDetail(await getEventDetails(detail.id)) } catch { /* ignore */ }
  }

  async function handleRespond(statusValue) {
    if (!detail) return
    setBusy(true)
    try {
      await respondToEvent(detail.id, statusValue)
      window.dispatchEvent(new Event('wishlle:notifications-changed'))
      await load()
      if (statusValue === 'accepted') {
        setDetail(await getEventDetails(detail.id))
        setMessage({ type: 'success', text: tr('Запрошення прийнято. Подію додано до вашого календаря.', 'Invitation accepted. The event was added to your calendar.') })
      } else {
        setDetail(null)
        setMessage({ type: 'success', text: tr('Запрошення відхилено.', 'Invitation declined.') })
      }
    } catch (error) {
      setMessage({ type: 'error', text: error?.message || tr('Не вдалося відповісти на запрошення.', 'Could not respond to the invitation.') })
    } finally {
      setBusy(false)
    }
  }

  async function handleInvite(userIds) {
    if (!detail || userIds.length === 0) return
    setBusy(true)
    try {
      setDetail(await inviteToEvent(detail.id, userIds))
      window.dispatchEvent(new Event('wishlle:notifications-changed'))
      setMessage({ type: 'success', text: tr('Запрошення надіслано.', 'Invitations sent.') })
    } catch (error) {
      setMessage({ type: 'error', text: error?.message || tr('Не вдалося запросити користувачів.', 'Could not invite users.') })
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
    } catch (error) {
      setMessage({ type: 'error', text: error?.message || tr('Не вдалося прибрати учасника.', 'Could not remove participant.') })
    } finally {
      setBusy(false)
    }
  }

  async function handleDeleteEvent() {
    if (!detail || !window.confirm(tr('Видалити цю подію?', 'Delete this event?'))) return
    setBusy(true)
    try {
      await deleteEvent(detail.id)
      setDetail(null)
      await load()
      window.dispatchEvent(new Event('wishlle:notifications-changed'))
      setMessage({ type: 'success', text: tr('Подію видалено.', 'Event deleted.') })
    } catch (error) {
      setMessage({ type: 'error', text: error?.message || tr('Не вдалося видалити подію.', 'Could not delete event.') })
    } finally {
      setBusy(false)
    }
  }

  async function handleSyncBirthdays() {
    setSyncing(true)
    try {
      const created = await syncBirthdayEvents()
      await load()
      const count = Array.isArray(created) ? created.length : 0
      setMessage({
        type: 'success',
        text: count > 0
          ? tr(`Створено нагадувань про дні народження: ${count}`, `Birthday reminders created: ${count}`)
          : tr('Нових днів народження немає.', 'No new birthdays.'),
      })
    } catch (error) {
      setMessage({ type: 'error', text: error?.message || tr('Не вдалося синхронізувати.', 'Could not sync.') })
    } finally {
      setSyncing(false)
    }
  }

  async function openWishlist(listId) {
    setListLoading(true)
    try {
      setListView(await viewFriendList(listId))
    } catch (error) {
      setMessage({ type: 'error', text: error?.message || tr('Не вдалося відкрити список.', 'Could not open wishlist.') })
    } finally {
      setListLoading(false)
    }
  }

  async function refreshWishlist() {
    if (!listView) return
    setListView(await viewFriendList(listView.id))
  }

  async function handleReserve(item) {
    setReservingId(item.id)
    try {
      await reserveItem(item.id)
      await refreshWishlist()
      window.dispatchEvent(new Event('wishlle:notifications-changed'))
    } catch (error) {
      setMessage({ type: 'error', text: error?.message || tr('Не вдалося зарезервувати подарунок.', 'Could not reserve gift.') })
    } finally {
      setReservingId('')
    }
  }

  async function handleCancelReserve(item) {
    setReservingId(item.id)
    try {
      await cancelReservation(item.id)
      await refreshWishlist()
    } catch (error) {
      setMessage({ type: 'error', text: error?.message || tr('Не вдалося скасувати резервування.', 'Could not cancel reservation.') })
    } finally {
      setReservingId('')
    }
  }

  const year = calMonth.getFullYear()
  const month = calMonth.getMonth()
  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const eventDates = new Set(events.filter(event => event.event_date).map(event => `${new Date(event.event_date).getDate()}-${new Date(event.event_date).getMonth()}`))
  const today = new Date()
  const months = language === 'en'
    ? ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    : ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень', 'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень']
  const weekdays = language === 'en' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] : ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд']
  const countdown = value => value === null ? '' : value < 0 ? tr('Минула', 'Past') : value === 0 ? tr('Сьогодні 🔥', 'Today 🔥') : value === 1 ? tr('Завтра 🔥', 'Tomorrow 🔥') : tr(`${value} дн.`, `${value} days`)
  const filters = [
    { id: 'all', label: tr('Мої події', 'My events') },
    { id: 'private', label: tr('Приватні', 'Private') },
    { id: 'group', label: tr('Групові', 'Group') },
    { id: 'invited', label: tr('Запрошення', 'Invitations') },
  ]

  return (
    <div className="anim-fade-up">
      <div className="wrap">
        <section className={s.pageHero}>
          <div>
            <span>{tr('КАЛЕНДАР ПОДІЙ', 'EVENT CALENDAR')}</span>
            <h1>{tr('Події', 'Events')}</h1>
            <p>{tr('Створюй приватні й групові події, надсилай запрошення та переглядай списки учасників.', 'Create private and group events, send invitations and browse participant wishlists.')}</p>
          </div>
          <div className={s.heroActions}>
            <button className="btn-outline" onClick={handleSyncBirthdays} disabled={syncing}>🎂 {syncing ? tr('Синхронізуємо…', 'Syncing…') : tr('Дні народження друзів', 'Friends’ birthdays')}</button>
            <button className="btn-primary" onClick={() => setShowCreate(true)}><AppIcon name="plus" size={15} /> {tr('Нова подія', 'New event')}</button>
          </div>
        </section>

        {invitations.length > 0 && filter !== 'invited' && (
          <button className={s.invitationStrip} onClick={() => setFilter('invited')}>
            <span>🎉</span>
            <div><strong>{tr('У вас є нові запрошення', 'You have new invitations')}</strong><small>{tr(`${invitations.length} очікує відповіді`, `${invitations.length} awaiting response`)}</small></div>
            <AppIcon name="arrowRight" size={16} />
          </button>
        )}

        {message.text && (
          <div className={`${s.notice} ${message.type === 'error' ? s.noticeError : s.noticeSuccess}`}>
            <span>{message.text}</span>
            <button onClick={() => setMessage({ type: '', text: '' })}>×</button>
          </div>
        )}

        <div className={s.layout}>
          <div>
            <div className={s.filters}>
              {filters.map(item => (
                <button key={item.id} className={filter === item.id ? s.filterActive : ''} onClick={() => setFilter(item.id)}>
                  {item.label}
                  {item.id === 'invited' && invitations.length > 0 && <b className={s.badge}>{invitations.length}</b>}
                </button>
              ))}
            </div>

            {loading ? (
              <div className={s.loading}><div className="auth-spinner" />{tr('Завантажуємо події…', 'Loading events…')}</div>
            ) : filtered.length === 0 ? (
              <div className={s.empty}>
                <div>{filter === 'invited' ? '📨' : '🗓️'}</div>
                <h2>{filter === 'invited' ? tr('Нових запрошень немає', 'No new invitations') : tr('Подій поки немає', 'No events yet')}</h2>
                <p>{filter === 'invited' ? tr('Коли друг запросить тебе, подія з’явиться тут до підтвердження.', 'Invitations will appear here until you respond.') : tr('Створи приватну подію для друга або групову зустріч.', 'Create a private event for a friend or a group gathering.')}</p>
                {filter !== 'invited' && <button className="btn-primary" onClick={() => setShowCreate(true)}><AppIcon name="plus" size={15} /> {tr('Створити подію', 'Create event')}</button>}
              </div>
            ) : (
              <div className={s.eventList}>
                {filtered.map(event => {
                  const meta = TYPE_META[event.event_type] || TYPE_META.group
                  const days = event.daysLeft
                  const urgent = days !== null && days >= 0 && days <= 1
                  const soon = days !== null && days > 1 && days <= 7
                  const pending = filter === 'invited' || event.my_status === 'invited'
                  return (
                    <article key={event.id} className={`${s.eventCard} ${pending ? s.eventCardPending : ''}`} onClick={() => openDetail(event.id)}>
                      <div className={s.eventIcon} style={{ background: meta.glow }}>{eventIcon(event)}</div>
                      <div className={s.eventBody}>
                        <div className={s.eventTitleRow}>
                          <h3>{event.title}</h3>
                          {event.is_auto && <span className={s.autoTag}>{tr('авто', 'auto')}</span>}
                          {pending && <span className={s.invitedTag}>{tr('очікує відповіді', 'awaiting response')}</span>}
                        </div>
                        <div className={s.eventMeta}>
                          <span>{event.event_date ? new Date(event.event_date).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }) : ''}</span>
                          {event.location && <span>· 📍 {event.location}</span>}
                          <span>· 👥 {event.participants_count}</span>
                          <span className={s.typeBadge}>{event.event_type === 'private' ? tr('Приватна', 'Private') : tr('Групова', 'Group')}</span>
                        </div>
                      </div>
                      {days !== null && <div className={`${s.countdown} ${urgent ? s.cdUrgent : soon ? s.cdSoon : ''}`}>{countdown(days)}</div>}
                    </article>
                  )
                })}
              </div>
            )}
          </div>

          <aside className={s.calendar}>
            <div className={s.calHead}>
              <button onClick={() => setCalMonth(new Date(year, month - 1))}>‹</button>
              <span>{months[month]} {year}</span>
              <button onClick={() => setCalMonth(new Date(year, month + 1))}>›</button>
            </div>
            <div className={s.calGrid}>
              {weekdays.map(day => <div key={day} className={s.calWeekday}>{day}</div>)}
              {Array.from({ length: firstDay }, (_, index) => <div key={`empty-${index}`} />)}
              {Array.from({ length: daysInMonth }, (_, index) => {
                const day = index + 1
                const hasEvent = eventDates.has(`${day}-${month}`)
                const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year
                return <div key={day} className={`${s.calDay} ${isToday ? s.calToday : ''} ${hasEvent ? s.calHasEvent : ''}`}>{day}{hasEvent && !isToday && <i />}</div>
              })}
            </div>
          </aside>
        </div>

        <Footer />
      </div>

      {showCreate && <CreateEventModal friends={friends} busy={busy} tr={tr} onClose={() => setShowCreate(false)} onCreate={handleCreate} />}
      {editing && <EditEventModal event={editing} friends={friends} busy={busy} tr={tr} onClose={() => setEditing(null)} onSave={handleUpdate} />}
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
          onEdit={() => setEditing(detail)}
          onOpenWishlist={openWishlist}
          listLoading={listLoading}
        />
      )}
      {listView && (
        <WishlistViewModal
          data={listView}
          myId={myId}
          busyId={reservingId}
          language={language}
          tr={tr}
          onClose={() => setListView(null)}
          onReserve={handleReserve}
          onCancel={handleCancelReserve}
        />
      )}
    </div>
  )
}

function IconPicker({ value, onChange, tr }) {
  return (
    <div className={s.field}>
      <span>{tr('Ярлик події', 'Event label')}</span>
      <div className={s.iconPicker}>
        {EVENT_ICONS.map(icon => <button type="button" key={icon} className={value === icon ? s.iconActive : ''} onClick={() => onChange(icon)}>{icon}</button>)}
      </div>
      <small className={s.hint}>{tr('Ярлик зберігається у вже наявному полі cover_image — нові поля в базі не потрібні.', 'The label uses the existing cover_image field — no database changes are required.')}</small>
    </div>
  )
}

function EventTypePicker({ form, setForm, tr }) {
  return (
    <div className={s.typeSwitch}>
      <button type="button" className={form.event_type === 'private' ? s.typeActive : ''} onClick={() => setForm(current => ({ ...current, event_type: 'private' }))}>
        🔒 {tr('Приватна', 'Private')}
        <small>{tr('Подія для одного іменинника та його списків', 'An event focused on one honoree and their wishlists')}</small>
      </button>
      <button type="button" className={form.event_type === 'group' ? s.typeActive : ''} onClick={() => setForm(current => ({ ...current, event_type: 'group', honoree_id: '' }))}>
        🎉 {tr('Групова', 'Group')}
        <small>{tr('Учасники бачать доступні списки одне одного', 'Participants see each other’s visible wishlists')}</small>
      </button>
    </div>
  )
}

function HonoreePicker({ friends, selected, onSelect, tr }) {
  return (
    <div className={s.field}>
      <span>{tr('Іменинник', 'Honoree')}</span>
      {friends.length === 0 ? <p className={s.hint}>{tr('Спершу додай друзів.', 'Add friends first.')}</p> : (
        <div className={s.honoreePicker}>
          {friends.map(friend => {
            const user = friend.user || {}
            const active = selected === friend.friend_id
            return (
              <button type="button" key={friend.id} className={active ? s.honoreeActive : ''} onClick={() => onSelect(friend.friend_id)}>
                <Avatar user={user} size={30} />
                <span>{friend.nickname || user.display_name || user.username}</span>
                {active && <AppIcon name="check" size={14} />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function CreateEventModal({ friends, busy, tr, onClose, onCreate }) {
  const [form, setForm] = useState({ title: '', description: '', event_date: '', location: '', event_type: 'private', honoree_id: '', cover_image: '🎂' })
  const [selectedParticipants, setSelectedParticipants] = useState([])

  function toggleParticipant(friendId) {
    setSelectedParticipants(current => current.includes(friendId) ? current.filter(item => item !== friendId) : [...current, friendId])
  }

  function submit() {
    if (!form.title.trim() || !form.event_date || (form.event_type === 'private' && !form.honoree_id)) return
    onCreate({
      title: form.title.trim(),
      description: form.description.trim() || null,
      event_date: form.event_date,
      location: form.location.trim() || null,
      event_type: form.event_type,
      honoree_id: form.event_type === 'private' ? form.honoree_id : null,
      cover_image: form.cover_image || null,
      participant_ids: selectedParticipants,
    })
  }

  return (
    <Modal onClose={() => !busy && onClose()} wide>
      <div className={s.modalHead}><div><span>{tr('НОВА ПОДІЯ', 'NEW EVENT')}</span><h2>{tr('Створити подію', 'Create event')}</h2><p>{tr('Запрошені отримають сповіщення, а подія з’явиться у них лише після підтвердження.', 'Invitees receive a notification and the event appears only after acceptance.')}</p></div><button onClick={onClose}><AppIcon name="close" size={18} /></button></div>
      <EventTypePicker form={form} setForm={setForm} tr={tr} />
      <IconPicker value={form.cover_image} onChange={cover_image => setForm(current => ({ ...current, cover_image }))} tr={tr} />
      <label className={s.field}><span>{tr('Назва події', 'Event title')}</span><input value={form.title} onChange={event => setForm(current => ({ ...current, title: event.target.value }))} maxLength={120} placeholder={tr('Наприклад, День народження Дані', 'For example, Dan’s birthday')} /></label>
      {form.event_type === 'private' && <HonoreePicker friends={friends} selected={form.honoree_id} onSelect={honoree_id => setForm(current => ({ ...current, honoree_id }))} tr={tr} />}
      <div className={s.row2}>
        <label className={s.field}><span>{tr('Дата', 'Date')}</span><input type="date" value={form.event_date} onChange={event => setForm(current => ({ ...current, event_date: event.target.value }))} /></label>
        <label className={s.field}><span>{tr('Місце (необов’язково)', 'Location (optional)')}</span><input value={form.location} onChange={event => setForm(current => ({ ...current, location: event.target.value }))} maxLength={255} placeholder={tr('Кафе, дім, …', 'Cafe, home, …')} /></label>
      </div>
      <label className={s.field}><span>{tr('Опис (необов’язково)', 'Description (optional)')}</span><textarea value={form.description} onChange={event => setForm(current => ({ ...current, description: event.target.value }))} rows={3} placeholder={tr('Деталі події…', 'Event details…')} /></label>
      <div className={s.field}>
        <span>{tr('Запросити друзів', 'Invite friends')} {selectedParticipants.length > 0 && `· ${selectedParticipants.length}`}</span>
        {friends.length === 0 ? <p className={s.hint}>{tr('Немає друзів для запрошення.', 'No friends to invite.')}</p> : (
          <div className={s.inviteGrid}>
            {friends.filter(friend => friend.friend_id !== form.honoree_id).map(friend => {
              const user = friend.user || {}
              const active = selectedParticipants.includes(friend.friend_id)
              return <button type="button" key={friend.id} className={active ? s.inviteActive : ''} onClick={() => toggleParticipant(friend.friend_id)}><Avatar user={user} size={28} /><span>{friend.nickname || user.display_name || user.username}</span>{active && <AppIcon name="check" size={13} />}</button>
            })}
          </div>
        )}
      </div>
      <div className={s.modalActions}><button className="btn-outline" onClick={onClose} disabled={busy}>{tr('Скасувати', 'Cancel')}</button><button className="btn-primary" onClick={submit} disabled={busy || !form.title.trim() || !form.event_date || (form.event_type === 'private' && !form.honoree_id)}>{busy ? tr('Створюємо…', 'Creating…') : tr('Створити й запросити', 'Create and invite')}</button></div>
    </Modal>
  )
}

function EditEventModal({ event, friends, busy, tr, onClose, onSave }) {
  const [form, setForm] = useState({
    title: event.title || '',
    description: event.description || '',
    event_date: event.event_date ? String(event.event_date).slice(0, 10) : '',
    location: event.location || '',
    event_type: event.event_type || 'group',
    honoree_id: event.honoree_id || '',
    cover_image: event.cover_image || eventIcon(event),
  })

  function submit() {
    if (!form.title.trim() || !form.event_date || (form.event_type === 'private' && !form.honoree_id)) return
    onSave({
      title: form.title.trim(),
      description: form.description.trim() || null,
      event_date: form.event_date,
      location: form.location.trim() || null,
      event_type: form.event_type,
      honoree_id: form.event_type === 'private' ? form.honoree_id : null,
      cover_image: form.cover_image || null,
    })
  }

  return (
    <Modal onClose={() => !busy && onClose()} wide>
      <div className={s.modalHead}><div><span>{tr('РЕДАГУВАННЯ', 'EDIT EVENT')}</span><h2>{tr('Налаштування події', 'Event settings')}</h2><p>{tr('Можна змінити тип події, іменинника та ярлик без додавання полів у базу.', 'You can change event type, honoree and label without adding database fields.')}</p></div><button onClick={onClose}><AppIcon name="close" size={18} /></button></div>
      <EventTypePicker form={form} setForm={setForm} tr={tr} />
      <IconPicker value={form.cover_image} onChange={cover_image => setForm(current => ({ ...current, cover_image }))} tr={tr} />
      <label className={s.field}><span>{tr('Назва події', 'Event title')}</span><input value={form.title} onChange={input => setForm(current => ({ ...current, title: input.target.value }))} maxLength={120} /></label>
      {form.event_type === 'private' && <HonoreePicker friends={friends} selected={form.honoree_id} onSelect={honoree_id => setForm(current => ({ ...current, honoree_id }))} tr={tr} />}
      <div className={s.row2}>
        <label className={s.field}><span>{tr('Дата', 'Date')}</span><input type="date" value={form.event_date} onChange={input => setForm(current => ({ ...current, event_date: input.target.value }))} /></label>
        <label className={s.field}><span>{tr('Місце', 'Location')}</span><input value={form.location} onChange={input => setForm(current => ({ ...current, location: input.target.value }))} maxLength={255} /></label>
      </div>
      <label className={s.field}><span>{tr('Опис', 'Description')}</span><textarea value={form.description} onChange={input => setForm(current => ({ ...current, description: input.target.value }))} rows={3} /></label>
      <div className={s.modalActions}><button className="btn-outline" onClick={onClose} disabled={busy}>{tr('Скасувати', 'Cancel')}</button><button className="btn-primary" onClick={submit} disabled={busy || !form.title.trim() || !form.event_date || (form.event_type === 'private' && !form.honoree_id)}><AppIcon name="check" size={15} />{busy ? tr('Зберігаємо…', 'Saving…') : tr('Зберегти зміни', 'Save changes')}</button></div>
    </Modal>
  )
}

function EventDetailModal({ detail, friends, myId, busy, tr, locale, onClose, onRespond, onInvite, onRemoveParticipant, onDelete, onEdit, onOpenWishlist, listLoading }) {
  const [inviteOpen, setInviteOpen] = useState(false)
  const [toInvite, setToInvite] = useState([])
  const days = daysUntil(detail.event_date)
  const participantUserIds = new Set(detail.participants.map(participant => participant.user_id))
  const invitableFriends = friends.filter(friend => !participantUserIds.has(friend.friend_id))
  const statusLabel = statusValue => statusValue === 'accepted' ? tr('Прийняв', 'Accepted') : statusValue === 'declined' ? tr('Відхилив', 'Declined') : tr('Запрошено', 'Invited')

  function toggleInvite(friendId) {
    setToInvite(current => current.includes(friendId) ? current.filter(item => item !== friendId) : [...current, friendId])
  }

  function sendInvites() {
    onInvite(toInvite)
    setToInvite([])
    setInviteOpen(false)
  }

  return (
    <Modal onClose={onClose} wide>
      <div className={s.modalHead}>
        <div><span>{detail.event_type === 'private' ? tr('ПРИВАТНА ПОДІЯ', 'PRIVATE EVENT') : tr('ГРУПОВА ПОДІЯ', 'GROUP EVENT')}</span><h2>{eventIcon(detail)} {detail.title}</h2><p>{detail.event_date ? new Date(detail.event_date).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : ''}{days !== null && days >= 0 && ` · ${days === 0 ? tr('сьогодні', 'today') : days === 1 ? tr('завтра', 'tomorrow') : tr(`через ${days} дн.`, `in ${days} days`)}`}</p></div>
        <div className={s.modalHeadButtons}>{detail.is_owner && !detail.is_auto && <button onClick={onEdit} title={tr('Редагувати', 'Edit')}><AppIcon name="edit" size={16} /></button>}<button onClick={onClose}><AppIcon name="close" size={18} /></button></div>
      </div>

      {detail.description && <p className={s.detailDesc}>{detail.description}</p>}
      {detail.location && <p className={s.detailLoc}>📍 {detail.location}</p>}

      {!detail.is_owner && detail.my_status === 'invited' && (
        <div className={s.inviteBanner}><span>{tr('Вас запросили на цю подію. Вона не з’явиться у вашому календарі, доки ви не приймете запрошення.', 'You were invited. The event will not appear in your calendar until you accept.')}</span><div><button className={s.declineBtn} onClick={() => onRespond('declined')} disabled={busy}>{tr('Відхилити', 'Decline')}</button><button className={s.acceptBtn} onClick={() => onRespond('accepted')} disabled={busy}><AppIcon name="check" size={14} /> {tr('Прийняти', 'Accept')}</button></div></div>
      )}
      {!detail.is_owner && detail.my_status === 'accepted' && <div className={s.statusBanner}>✅ {tr('Ви берете участь у події.', 'You are attending this event.')}</div>}

      <div className={s.sectionTitle}><strong>{tr('Учасники', 'Participants')} · {detail.participants.length}</strong>{detail.is_owner && invitableFriends.length > 0 && <button className={s.smallBtn} onClick={() => setInviteOpen(value => !value)}><AppIcon name="plus" size={13} /> {tr('Запросити', 'Invite')}</button>}</div>
      {inviteOpen && (
        <div className={s.invitePanel}>
          <div className={s.inviteGrid}>{invitableFriends.map(friend => { const user = friend.user || {}; const active = toInvite.includes(friend.friend_id); return <button type="button" key={friend.id} className={active ? s.inviteActive : ''} onClick={() => toggleInvite(friend.friend_id)}><Avatar user={user} size={26} /><span>{friend.nickname || user.display_name || user.username}</span>{active && <AppIcon name="check" size={12} />}</button> })}</div>
          <button className="btn-primary" disabled={toInvite.length === 0 || busy} onClick={sendInvites}>{tr('Надіслати запрошення', 'Send invites')} {toInvite.length > 0 && `(${toInvite.length})`}</button>
        </div>
      )}

      {detail.participants.length === 0 ? <div className={s.noParticipants}>{tr('Поки немає учасників.', 'No participants yet.')}</div> : (
        <div className={s.participantList}>{detail.participants.map(participant => (
          <div key={participant.id} className={s.participant}>
            <Avatar user={participant.user} size={38} />
            <div className={s.pInfo}><strong>{participant.user.display_name || participant.user.username || tr('Користувач', 'User')}{participant.user_id === myId && ` (${tr('ви', 'you')})`}</strong>{participant.user.username && <span>@{participant.user.username}</span>}</div>
            <div className={s.pBadges}>{participant.role === 'honoree' && <span className={s.honoreeBadge}>🎂 {tr('Іменинник', 'Honoree')}</span>}<span className={`${s.statusBadge} ${participant.status === 'accepted' ? s.stAccepted : participant.status === 'declined' ? s.stDeclined : s.stInvited}`}>{statusLabel(participant.status)}</span>{detail.is_owner && <button className={s.removeP} onClick={() => onRemoveParticipant(participant.user_id)} disabled={busy}><AppIcon name="close" size={12} /></button>}</div>
          </div>
        ))}</div>
      )}

      <div className={s.sectionTitle}><strong>{detail.event_type === 'private' ? tr('Списки побажань іменинника', 'Honoree wishlists') : tr('Списки побажань учасників', 'Participant wishlists')} · {detail.wishlists.length}</strong></div>
      {detail.wishlists.length === 0 ? <div className={s.noWishlists}><span>🎁</span><p>{tr('Доступних списків поки немає.', 'There are no visible wishlists yet.')}</p></div> : (
        <div className={s.wishlistGrid}>{detail.wishlists.map(wishlist => (
          <button type="button" key={wishlist.id} className={s.wishlistCard} onClick={() => onOpenWishlist(wishlist.id)} disabled={listLoading}>
            <div className={s.wlCover}><span>{wishlist.emoji}</span></div>
            <div className={s.wlBody}><h4>{wishlist.title}</h4><p>{wishlist.owner_name} · {wishlist.items_count} {tr('бажань', 'wishes')}</p><small>{tr('Натисни, щоб відкрити', 'Tap to open')}</small></div>
            <AppIcon name="arrowRight" size={15} />
          </button>
        ))}</div>
      )}

      {detail.is_owner && <div className={s.modalActions}><button className={s.dangerBtn} onClick={onDelete} disabled={busy}><AppIcon name="trash" size={15} /> {tr('Видалити подію', 'Delete event')}</button></div>}
    </Modal>
  )
}

function WishlistViewModal({ data, myId, busyId, language, tr, onClose, onReserve, onCancel }) {
  const isOwner = data.owner_id === myId
  return (
    <Modal onClose={onClose} extraWide>
      <div className={s.modalHead}><div><span>{tr('СПИСОК ПОБАЖАНЬ', 'WISHLIST')}</span><h2>{data.emoji} {data.title}</h2><p>{isOwner ? tr('Це ваш список. У події він відкривається лише для перегляду.', 'This is your wishlist and is read-only here.') : tr('Можна відкрити товар і зарезервувати подарунок.', 'Open a product or reserve a gift.')}</p></div><button onClick={onClose}><AppIcon name="close" size={18} /></button></div>
      {data.items.length === 0 ? <div className={s.noWishlists}><span>🎁</span><p>{tr('Список поки порожній.', 'The wishlist is empty.')}</p></div> : (
        <div className={s.reserveList}>{data.items.map(item => {
          const reserved = item.is_reserved
          const mine = item.reserved_by_me
          return (
            <article key={item.id} className={`${s.reserveItem} ${reserved ? s.reserveItemTaken : ''}`}>
              <div className={s.reserveThumb}>{item.image_url ? <img src={item.image_url} alt="" /> : <span>🎁</span>}</div>
              <div className={s.reserveInfo}><h4>{item.title}</h4>{item.price != null && <strong>{Number(item.price).toLocaleString(language === 'en' ? 'en-US' : 'uk-UA')} ₴</strong>}{item.notes && <p>{item.notes}</p>}{item.url && (!reserved || mine || isOwner) && <a href={item.url} target="_blank" rel="noreferrer"><AppIcon name="link" size={13} /> {tr('Перейти до товару', 'Open product')}</a>}</div>
              <div className={s.reserveAction}>{isOwner ? <span className={s.reserveNeutral}>{tr('Ваш список', 'Your wishlist')}</span> : mine ? <><span className={s.reserveMine}><AppIcon name="check" size={13} /> {tr('Ви зарезервували', 'Reserved by you')}</span><button onClick={() => onCancel(item)} disabled={busyId === item.id}>{tr('Скасувати', 'Cancel')}</button></> : reserved ? <span className={s.reserveTaken}>🔒 {tr('Вже зарезервовано', 'Already reserved')}</span> : <button className={s.reserveButton} onClick={() => onReserve(item)} disabled={busyId === item.id}><AppIcon name="gift" size={15} /> {busyId === item.id ? tr('Резервуємо…', 'Reserving…') : tr('Зарезервувати', 'Reserve')}</button>}</div>
            </article>
          )
        })}</div>
      )}
    </Modal>
  )
}
