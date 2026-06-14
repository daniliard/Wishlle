import { useEffect, useRef, useState, useCallback } from 'react'
import AppIcon from './AppIcons'
import {
  getNotifications, getUnreadCount, markNotificationRead,
  markAllNotificationsRead, deleteNotification,
} from '../api/client'
import { useLanguage } from '../i18n/LanguageContext'
import s from './NotificationBell.module.css'

const TYPE_ICON = {
  friend_request:  '👋',
  friend_accepted: '🤝',
  event_invite:    '🎉',
  event_reminder:  '🗓️',
  reservation:     '🎁',
}

function timeAgo(dateStr, language) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return language === 'en' ? 'just now' : 'щойно'
  if (min < 60) return language === 'en' ? `${min}m ago` : `${min} хв тому`
  const hr = Math.floor(min / 60)
  if (hr < 24) return language === 'en' ? `${hr}h ago` : `${hr} год тому`
  const d = Math.floor(hr / 24)
  return language === 'en' ? `${d}d ago` : `${d} дн тому`
}

export default function NotificationBell({ onNav }) {
  const { tr, language } = useLanguage()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(false)
  const ref = useRef(null)

  const loadUnread = useCallback(async () => {
    try {
      const data = await getUnreadCount()
      setUnread(data?.count || 0)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    loadUnread()
    const timer = setInterval(loadUnread, 60000) // оновлюємо лічильник раз на хвилину
    return () => clearInterval(timer)
  }, [loadUnread])

  useEffect(() => {
    function onOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', onOutside)
    return () => document.removeEventListener('pointerdown', onOutside)
  }, [])

  async function toggleOpen() {
    const next = !open
    setOpen(next)
    if (next) {
      setLoading(true)
      try {
        const data = await getNotifications()
        setItems(Array.isArray(data) ? data : [])
      } catch { setItems([]) }
      finally { setLoading(false) }
    }
  }

  async function handleClick(n) {
    if (!n.is_read) {
      try { await markNotificationRead(n.id) } catch { /* ignore */ }
      setItems(cur => cur.map(x => x.id === n.id ? { ...x, is_read: true } : x))
      setUnread(c => Math.max(0, c - 1))
    }
    // Навігація за полем nav з бекенду (friends/events/lists)
    if (n.nav) onNav?.(n.nav)
    setOpen(false)
  }

  async function handleReadAll() {
    try {
      await markAllNotificationsRead()
      setItems(cur => cur.map(x => ({ ...x, is_read: true })))
      setUnread(0)
    } catch { /* ignore */ }
  }

  async function handleDelete(e, id) {
    e.stopPropagation()
    try {
      await deleteNotification(id)
      setItems(cur => cur.filter(x => x.id !== id))
      loadUnread()
    } catch { /* ignore */ }
  }

  return (
    <div className={s.wrap} ref={ref}>
      <button type="button" className={s.bellBtn} onClick={toggleOpen} aria-label={tr('Сповіщення', 'Notifications')}>
        <AppIcon name="bell" size={18} />
        {unread > 0 && <span className={s.dot}>{unread > 9 ? '9+' : unread}</span>}
      </button>

      {open && (
        <div className={s.panel}>
          <div className={s.head}>
            <strong>{tr('Сповіщення', 'Notifications')}</strong>
            {unread > 0 && (
              <button type="button" onClick={handleReadAll}>{tr('Прочитати всі', 'Mark all read')}</button>
            )}
          </div>

          <div className={s.list}>
            {loading ? (
              <div className={s.state}>{tr('Завантаження…', 'Loading…')}</div>
            ) : items.length === 0 ? (
              <div className={s.empty}>
                <span>🔔</span>
                <p>{tr('Поки немає сповіщень', 'No notifications yet')}</p>
              </div>
            ) : (
              items.map(n => (
                <button type="button" key={n.id} className={`${s.item} ${n.is_read ? '' : s.unread}`} onClick={() => handleClick(n)}>
                  <div className={s.icon}>{TYPE_ICON[n.type] || '🔔'}</div>
                  <div className={s.body}>
                    <div className={s.title}>{n.title}</div>
                    {n.body && <div className={s.text}>{n.body}</div>}
                    <div className={s.time}>{timeAgo(n.created_at, language)}</div>
                  </div>
                  {!n.is_read && <span className={s.unreadDot} />}
                  <span className={s.del} onClick={e => handleDelete(e, n.id)}><AppIcon name="close" size={13} /></span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
