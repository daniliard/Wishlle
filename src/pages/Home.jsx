import { useEffect, useMemo, useState } from 'react'
import AppIcon from '../components/AppIcons'
import { getFriends, getMyEvents, getMyLists } from '../api/client'
import s from './Home.module.css'

function normaliseArray(value) {
  return Array.isArray(value) ? value : []
}

function dateLabel(value) {
  if (!value) return 'Без дати'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'long' }).format(date)
}

function getFirstName(user) {
  return user?.display_name?.trim().split(/\s+/)[0] || user?.username || 'друже'
}

export default function Home({ onNav, user }) {
  const [lists, setLists] = useState([])
  const [events, setEvents] = useState([])
  const [friends, setFriends] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    Promise.allSettled([getMyLists(), getMyEvents(), getFriends()])
      .then(([listsResult, eventsResult, friendsResult]) => {
        if (cancelled) return
        if (listsResult.status === 'fulfilled') setLists(normaliseArray(listsResult.value))
        if (eventsResult.status === 'fulfilled') setEvents(normaliseArray(eventsResult.value))
        if (friendsResult.status === 'fulfilled') setFriends(normaliseArray(friendsResult.value))
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [])

  const upcomingEvents = useMemo(() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    return events
      .filter(item => item.event_date)
      .map(item => ({ ...item, parsedDate: new Date(item.event_date) }))
      .filter(item => !Number.isNaN(item.parsedDate.getTime()) && item.parsedDate >= now)
      .sort((a, b) => a.parsedDate - b.parsedDate)
      .slice(0, 3)
  }, [events])

  const profileFields = [user?.display_name, user?.username, user?.birth_date, user?.avatar_url]
  const profileProgress = Math.round((profileFields.filter(Boolean).length / profileFields.length) * 100)

  return (
    <div className={s.page}>
      <section className={s.welcomeCard}>
        <div className={s.welcomeGlow} />
        <div className={s.welcomeContent}>
          <div className={s.eyebrow}><AppIcon name="sparkles" size={15} /> Особистий простір Wishlle</div>
          <h2>Привіт, {getFirstName(user)} 👋</h2>
          <p>Збирай бажання в одному місці, плануй події та допомагай друзям обирати справді потрібні подарунки.</p>
          <div className={s.actions}>
            <button type="button" className="btn-primary" onClick={() => onNav('lists')}>
              <AppIcon name="plus" size={17} /> Створити список
            </button>
            <button type="button" className="btn-outline" onClick={() => onNav('events')}>
              <AppIcon name="events" size={17} /> Додати подію
            </button>
          </div>
        </div>
        <div className={s.welcomeArt} aria-hidden="true">
          <div className={s.giftCircle}><AppIcon name="gift" size={62} strokeWidth={1.45} /></div>
          <span className={s.artDotOne} />
          <span className={s.artDotTwo} />
          <span className={s.artDotThree} />
        </div>
      </section>

      <section className={s.statsGrid} aria-label="Статистика">
        {[
          { label: 'Мої списки', value: lists.length, icon: 'lists', hint: 'створено' },
          { label: 'Друзі', value: friends.length, icon: 'friends', hint: 'у твоєму колі' },
          { label: 'Події', value: events.length, icon: 'events', hint: 'заплановано' },
        ].map(item => (
          <article key={item.label} className={s.statCard}>
            <div className={s.statIcon}><AppIcon name={item.icon} size={22} /></div>
            <div>
              <strong>{loading ? '—' : item.value}</strong>
              <span>{item.label}</span>
              <small>{item.hint}</small>
            </div>
          </article>
        ))}
      </section>

      <section className={s.mainGrid}>
        <div className={s.panel}>
          <div className={s.panelHeader}>
            <div>
              <span className={s.panelEyebrow}>Швидкий доступ</span>
              <h3>Що зробимо сьогодні?</h3>
            </div>
          </div>
          <div className={s.quickGrid}>
            {[
              { title: 'Новий список', text: 'Створи окремий список для свята, мрій або покупок.', icon: 'lists', page: 'lists' },
              { title: 'Знайти друга', text: 'Додай близьку людину та переглядай доступні списки.', icon: 'userCheck', page: 'friends' },
              { title: 'Запланувати подію', text: 'Не забудь про день народження або спільне свято.', icon: 'events', page: 'events' },
              { title: 'Переглянути каталог', text: 'Знайди ідею подарунка та збережи її до списку.', icon: 'catalog', page: 'catalog' },
            ].map(item => (
              <button type="button" key={item.title} className={s.quickCard} onClick={() => onNav(item.page)}>
                <span className={s.quickIcon}><AppIcon name={item.icon} size={22} /></span>
                <span className={s.quickCopy}>
                  <strong>{item.title}</strong>
                  <small>{item.text}</small>
                </span>
                <AppIcon name="arrowRight" size={17} className={s.quickArrow} />
              </button>
            ))}
          </div>
        </div>

        <aside className={s.sideColumn}>
          <div className={s.panel}>
            <div className={s.panelHeaderCompact}>
              <div>
                <span className={s.panelEyebrow}>Профіль</span>
                <h3>Заповнено на {profileProgress}%</h3>
              </div>
              <button type="button" onClick={() => onNav('account')}><AppIcon name="edit" size={16} /></button>
            </div>
            <div className={s.progressTrack}><span style={{ width: `${profileProgress}%` }} /></div>
            <p className={s.profileHint}>
              {profileProgress === 100
                ? 'Чудово — профіль повністю заповнений.'
                : 'Додай дату народження та актуальний аватар, щоб друзям було простіше тебе знайти.'}
            </p>
            <button type="button" className={s.textButton} onClick={() => onNav('account')}>Відкрити профіль <AppIcon name="arrowRight" size={15} /></button>
          </div>

          <div className={s.panel}>
            <div className={s.panelHeaderCompact}>
              <div>
                <span className={s.panelEyebrow}>Найближче</span>
                <h3>Події</h3>
              </div>
              <button type="button" onClick={() => onNav('events')}><AppIcon name="arrowRight" size={16} /></button>
            </div>

            {upcomingEvents.length ? (
              <div className={s.eventsList}>
                {upcomingEvents.map((event, index) => (
                  <div key={event.id || `${event.title}-${index}`} className={s.eventRow}>
                    <span className={s.eventDate}>{event.parsedDate.getDate()}<small>{event.parsedDate.toLocaleDateString('uk-UA', { month: 'short' })}</small></span>
                    <div>
                      <strong>{event.title || 'Подія'}</strong>
                      <small>{event.location || dateLabel(event.event_date)}</small>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={s.emptyState}>
                <AppIcon name="events" size={26} />
                <p>Поки немає запланованих подій.</p>
                <button type="button" onClick={() => onNav('events')}>Додати першу</button>
              </div>
            )}
          </div>
        </aside>
      </section>
    </div>
  )
}
