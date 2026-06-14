import { useEffect, useMemo, useState } from 'react'
import Footer from '../components/Footer'
import AppIcon from '../components/AppIcons'
import {
  addFriend,
  acceptFriendRequest,
  getFriendDetails,
  getFriendRequests,
  getFriends,
  rejectFriendRequest,
  removeFriend,
  searchUsers,
  updateFriend,
  viewFriendList,
  reserveItem,
  cancelReservation,
} from '../api/client'
import { useLanguage } from '../i18n/LanguageContext'
import s from './Friends.module.css'

const QUICK_TAGS_UK = ['Родина', 'Друзі', 'Навчання', 'Робота', 'Ігри']
const QUICK_TAGS_EN = ['Family', 'Friends', 'Study', 'Work', 'Games']

function initials(user, nickname = '') {
  const source = nickname || user?.display_name || user?.username || 'W'
  return source
    .split(/\s+/)
    .filter(Boolean)
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function daysUntilBirthday(dateString) {
  if (!dateString) return null
  const source = new Date(dateString)
  if (Number.isNaN(source.getTime())) return null

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  let next = new Date(now.getFullYear(), source.getMonth(), source.getDate())
  if (next < today) next = new Date(now.getFullYear() + 1, source.getMonth(), source.getDate())
  return Math.round((next.getTime() - today.getTime()) / 86400000)
}

function birthdayText(days, tr) {
  if (days === null) return ''
  if (days === 0) return tr('День народження сьогодні', 'Birthday today')
  if (days === 1) return tr('День народження завтра', 'Birthday tomorrow')
  return tr(`До дня народження ${days} дн.`, `${days} days until birthday`)
}

function UserAvatar({ user, nickname = '', size = 'normal' }) {
  return (
    <div className={`${s.avatar} ${size === 'large' ? s.avatarLarge : ''}`}>
      {user?.avatar_url ? (
        <img src={user.avatar_url} alt="" />
      ) : (
        <span>{initials(user, nickname)}</span>
      )}
    </div>
  )
}

function Modal({ children, onClose, wide = false }) {
  return (
    <div className={s.modalBackdrop} onMouseDown={onClose}>
      <div className={`${s.modal} ${wide ? s.modalWide : ''}`} onMouseDown={event => event.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

export default function Friends() {
  const { language, tr } = useLanguage()
  const [friends, setFriends] = useState([])
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [requestActionId, setRequestActionId] = useState('')
  const [pageError, setPageError] = useState('')
  const [message, setMessage] = useState({ type: '', text: '' })

  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [addingId, setAddingId] = useState('')

  const [activeTag, setActiveTag] = useState('all')
  const [editFriend, setEditFriend] = useState(null)
  const [editNickname, setEditNickname] = useState('')
  const [editTags, setEditTags] = useState([])
  const [tagInput, setTagInput] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  const [details, setDetails] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(false)

  // Перегляд повного списку друга + резервування
  const [listView, setListView] = useState(null)
  const [listViewLoading, setListViewLoading] = useState(false)
  const [reservingId, setReservingId] = useState('')

  async function loadFriends() {
    setLoading(true)
    setPageError('')
    try {
      const [friendsData, requestsData] = await Promise.all([
        getFriends(),
        getFriendRequests(),
      ])
      setFriends(Array.isArray(friendsData) ? friendsData : [])
      setRequests(Array.isArray(requestsData) ? requestsData : [])
    } catch (error) {
      setPageError(error?.message || tr('Не вдалося завантажити друзів.', 'Could not load friends.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFriends()
    const refresh = () => loadFriends()
    window.addEventListener('wishlle:friend-requests-changed', refresh)
    return () => window.removeEventListener('wishlle:friend-requests-changed', refresh)
  }, [])

  useEffect(() => {
    const normalized = query.trim()
    if (normalized.length < 2) {
      setResults([])
      setSearching(false)
      return undefined
    }

    let cancelled = false
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const data = await searchUsers(normalized)
        if (!cancelled) setResults(Array.isArray(data) ? data : [])
      } catch (error) {
        if (!cancelled) {
          setResults([])
          setMessage({ type: 'error', text: error?.message || tr('Пошук не спрацював.', 'Search failed.') })
        }
      } finally {
        if (!cancelled) setSearching(false)
      }
    }, 350)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query, tr])

  const allTags = useMemo(() => {
    const values = new Set()
    friends.forEach(friend => (friend.tags || []).forEach(tag => values.add(tag)))
    return [...values].sort((a, b) => a.localeCompare(b, language === 'en' ? 'en' : 'uk'))
  }, [friends, language])

  const filteredFriends = useMemo(() => {
    if (activeTag === 'all') return friends
    return friends.filter(friend => (friend.tags || []).includes(activeTag))
  }, [activeTag, friends])

  const birthdaysSoon = useMemo(
    () => friends.filter(friend => {
      const days = daysUntilBirthday(friend.user?.birth_date)
      return days !== null && days <= 30
    }).length,
    [friends],
  )

  const accessibleLists = useMemo(
    () => friends.reduce((sum, friend) => sum + Number(friend.accessible_lists_count || 0), 0),
    [friends],
  )

  async function handleAdd(user) {
    setAddingId(user.id)
    setMessage({ type: '', text: '' })
    try {
      const created = await addFriend(user.id)
      setResults(current => current.map(item => item.id === user.id ? {
        ...item,
        can_add: false,
        request_status: 'outgoing',
        request_id: created?.id || null,
      } : item))
      setMessage({ type: 'success', text: tr('Заявку в друзі надіслано.', 'Friend request sent.') })
    } catch (error) {
      setMessage({ type: 'error', text: error?.message || tr('Не вдалося надіслати заявку.', 'Could not send friend request.') })
    } finally {
      setAddingId('')
    }
  }

  async function handleAcceptRequest(request) {
    setRequestActionId(request.id)
    setMessage({ type: '', text: '' })
    try {
      const created = await acceptFriendRequest(request.id)
      setRequests(current => current.filter(item => item.id !== request.id))
      window.dispatchEvent(new Event('wishlle:notifications-changed'))
      setFriends(current => [created, ...current.filter(item => item.friend_id !== created.friend_id)])
      setResults(current => current.map(item => item.id === request.requester_id ? {
        ...item,
        already_added: true,
        can_add: false,
        request_status: 'friends',
        request_id: null,
      } : item))
      setMessage({ type: 'success', text: tr('Заявку прийнято. Тепер ви друзі 🤝', 'Request accepted. You are now friends 🤝') })
    } catch (error) {
      setMessage({ type: 'error', text: error?.message || tr('Не вдалося прийняти заявку.', 'Could not accept the request.') })
    } finally {
      setRequestActionId('')
    }
  }

  async function handleRejectRequest(request) {
    setRequestActionId(request.id)
    setMessage({ type: '', text: '' })
    try {
      await rejectFriendRequest(request.id)
      setRequests(current => current.filter(item => item.id !== request.id))
      window.dispatchEvent(new Event('wishlle:notifications-changed'))
      setResults(current => current.map(item => item.id === request.requester_id ? {
        ...item,
        can_add: true,
        request_status: 'none',
        request_id: null,
      } : item))
      setMessage({ type: 'success', text: tr('Заявку відхилено.', 'Friend request declined.') })
    } catch (error) {
      setMessage({ type: 'error', text: error?.message || tr('Не вдалося відхилити заявку.', 'Could not decline the request.') })
    } finally {
      setRequestActionId('')
    }
  }

  function openEdit(friend) {
    setEditFriend(friend)
    setEditNickname(friend.nickname || '')
    setEditTags(friend.tags || [])
    setTagInput('')
    setMessage({ type: '', text: '' })
  }

  function addTag(rawValue) {
    const tag = rawValue.trim()
    if (!tag || editTags.some(item => item.toLowerCase() === tag.toLowerCase())) return
    if (editTags.length >= 8) {
      setMessage({ type: 'error', text: tr('Можна додати максимум 8 тегів.', 'You can add up to 8 tags.') })
      return
    }
    setEditTags(current => [...current, tag])
    setTagInput('')
  }

  async function saveFriendSettings() {
    if (!editFriend) return
    setSavingEdit(true)
    setMessage({ type: '', text: '' })
    try {
      const updated = await updateFriend(editFriend.id, {
        nickname: editNickname.trim() || null,
        tags: editTags,
      })
      setFriends(current => current.map(item => item.id === updated.id ? updated : item))
      setEditFriend(updated)
      setMessage({ type: 'success', text: tr('Налаштування друга збережено.', 'Friend settings saved.') })
      setTimeout(() => setEditFriend(null), 350)
    } catch (error) {
      setMessage({ type: 'error', text: error?.message || tr('Не вдалося зберегти зміни.', 'Could not save changes.') })
    } finally {
      setSavingEdit(false)
    }
  }

  async function handleRemoveFriend() {
    if (!editFriend) return
    const accepted = window.confirm(tr('Видалити цього користувача зі списку друзів?', 'Remove this user from your friend list?'))
    if (!accepted) return

    setSavingEdit(true)
    try {
      await removeFriend(editFriend.id)
      setFriends(current => current.filter(item => item.id !== editFriend.id))
      setEditFriend(null)
      setDetails(null)
      setMessage({ type: 'success', text: tr('Користувача видалено зі списку друзів.', 'User removed from friends.') })
    } catch (error) {
      setMessage({ type: 'error', text: error?.message || tr('Не вдалося видалити друга.', 'Could not remove friend.') })
    } finally {
      setSavingEdit(false)
    }
  }

  async function openDetails(friend) {
    setDetailsLoading(true)
    setMessage({ type: '', text: '' })
    try {
      const data = await getFriendDetails(friend.friend_id)
      setDetails(data)
    } catch (error) {
      setMessage({ type: 'error', text: error?.message || tr('Не вдалося відкрити профіль друга.', 'Could not open friend profile.') })
    } finally {
      setDetailsLoading(false)
    }
  }

  async function openListView(listId) {
    setListViewLoading(true)
    setMessage({ type: '', text: '' })
    try {
      const data = await viewFriendList(listId)
      setDetails(null)          // закриваємо профіль друга, щоб список був поверх
      setListView(data)
    } catch (error) {
      setMessage({ type: 'error', text: error?.message || tr('Не вдалося відкрити список.', 'Could not open the list.') })
    } finally {
      setListViewLoading(false)
    }
  }

  async function refreshListView() {
    if (!listView) return
    try {
      const data = await viewFriendList(listView.id)
      setListView(data)
    } catch { /* мовчки */ }
  }

  async function handleReserve(item) {
    setReservingId(item.id)
    setMessage({ type: '', text: '' })
    try {
      await reserveItem(item.id)
      await refreshListView()
      setMessage({ type: 'success', text: tr('Подарунок зарезервовано 🎁', 'Gift reserved 🎁') })
    } catch (error) {
      setMessage({ type: 'error', text: error?.message || tr('Не вдалося зарезервувати.', 'Could not reserve.') })
    } finally {
      setReservingId('')
    }
  }

  async function handleCancelReserve(item) {
    setReservingId(item.id)
    setMessage({ type: '', text: '' })
    try {
      await cancelReservation(item.id)
      await refreshListView()
      setMessage({ type: 'success', text: tr('Резервування скасовано.', 'Reservation cancelled.') })
    } catch (error) {
      setMessage({ type: 'error', text: error?.message || tr('Не вдалося скасувати.', 'Could not cancel.') })
    } finally {
      setReservingId('')
    }
  }

  const quickTags = language === 'en' ? QUICK_TAGS_EN : QUICK_TAGS_UK

  return (
    <div className="anim-fade-up">
      <div className="wrap">
        <section className={s.pageHero}>
          <div>
            <span>{tr('ТВОЄ КОЛО', 'YOUR CIRCLE')}</span>
            <h1>{tr('Друзі', 'Friends')}</h1>
            <p>{tr('Надсилай заявки, підтверджуй дружбу, групуй людей тегами та переглядай доступні списки побажань.', 'Send requests, confirm friendships, group people with tags and browse visible wishlists.')}</p>
          </div>
          <div className={s.heroBadge}>
            <AppIcon name="friends" size={22} />
            <div>
              <strong>{friends.length}</strong>
              <small>{tr('у твоєму колі', 'in your circle')}</small>
            </div>
          </div>
        </section>

        {message.text && (
          <div className={`${s.notice} ${message.type === 'error' ? s.noticeError : s.noticeSuccess}`}>
            <span>{message.text}</span>
            <button type="button" onClick={() => setMessage({ type: '', text: '' })}>×</button>
          </div>
        )}

        {pageError && (
          <div className={`${s.notice} ${s.noticeError}`}>
            <span>{pageError}</span>
            <button type="button" onClick={loadFriends}>{tr('Повторити', 'Retry')}</button>
          </div>
        )}

        {requests.length > 0 && (
          <section className={s.requestsSection}>
            <div className={s.requestsHeading}>
              <div>
                <span>{tr('ВХІДНІ ЗАЯВКИ', 'INCOMING REQUESTS')}</span>
                <strong>{tr('Хочуть додатися в друзі', 'People who want to add you')}</strong>
              </div>
              <b>{requests.length}</b>
            </div>
            <div className={s.requestsGrid}>
              {requests.map(request => (
                <article className={s.requestCard} key={request.id}>
                  <UserAvatar user={request.user} />
                  <div className={s.requestCopy}>
                    <strong>{request.user?.display_name || request.user?.username || tr('Користувач', 'User')}</strong>
                    {request.user?.username && <span>@{request.user.username}</span>}
                    <small>{tr('Хоче додати тебе в друзі', 'Wants to add you as a friend')}</small>
                  </div>
                  <div className={s.requestActions}>
                    <button
                      type="button"
                      className={s.rejectRequest}
                      onClick={() => handleRejectRequest(request)}
                      disabled={requestActionId === request.id}
                    >
                      {tr('Відхилити', 'Decline')}
                    </button>
                    <button
                      type="button"
                      className={s.acceptRequest}
                      onClick={() => handleAcceptRequest(request)}
                      disabled={requestActionId === request.id}
                    >
                      <AppIcon name="check" size={14} />
                      {requestActionId === request.id ? tr('Обробляємо…', 'Processing…') : tr('Прийняти', 'Accept')}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        <section className={s.statsGrid}>
          <article className={s.statCard}><span><AppIcon name="friends" /></span><div><strong>{friends.length}</strong><small>{tr('друзів', 'friends')}</small></div></article>
          <article className={s.statCard}><span>🏷️</span><div><strong>{allTags.length}</strong><small>{tr('тегів', 'tags')}</small></div></article>
          <article className={s.statCard}><span>🎂</span><div><strong>{birthdaysSoon}</strong><small>{tr('днів народження до 30 днів', 'birthdays in 30 days')}</small></div></article>
          <article className={s.statCard}><span>🎁</span><div><strong>{accessibleLists}</strong><small>{tr('доступних списків', 'visible wishlists')}</small></div></article>
        </section>

        <section className={s.searchSection}>
          <div className={s.searchCopy}>
            <strong>{tr('Знайти користувача', 'Find a user')}</strong>
            <span>{tr('Введи щонайменше 2 символи нікнейма або імені.', 'Enter at least 2 characters of a username or name.')}</span>
          </div>
          <div className={s.searchArea}>
            <div className={s.searchBox}>
              <AppIcon name="search" size={18} />
              <input
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder={tr('Наприклад, @xand22', 'For example, @xand22')}
                autoComplete="off"
              />
              {query && <button type="button" onClick={() => setQuery('')}><AppIcon name="close" size={15} /></button>}
            </div>

            {(query.trim().length >= 2 || searching) && (
              <div className={s.searchResults}>
                {searching && <div className={s.searchState}>{tr('Шукаємо користувачів…', 'Searching users…')}</div>}
                {!searching && results.length === 0 && <div className={s.searchState}>{tr('Нікого не знайдено.', 'Nobody found.')}</div>}
                {!searching && results.map(user => (
                  <div className={s.searchUser} key={user.id}>
                    <UserAvatar user={user} />
                    <div className={s.searchUserCopy}>
                      <strong>{user.display_name || user.username || tr('Користувач', 'User')}</strong>
                      {user.username && <span>@{user.username}</span>}
                    </div>
                    {user.request_status === 'friends' || user.already_added ? (
                      <span className={s.addedBadge}><AppIcon name="check" size={14} />{tr('У друзях', 'Friends')}</span>
                    ) : user.request_status === 'outgoing' ? (
                      <span className={s.pendingBadge}>⏳ {tr('Заявку надіслано', 'Request sent')}</span>
                    ) : user.request_status === 'incoming' ? (
                      <span className={s.incomingBadge}>👋 {tr('Є вхідна заявка', 'Incoming request')}</span>
                    ) : user.can_add ? (
                      <button type="button" className={s.addButton} onClick={() => handleAdd(user)} disabled={addingId === user.id}>
                        <AppIcon name="plus" size={15} />
                        {addingId === user.id ? tr('Надсилаємо…', 'Sending…') : tr('Додати', 'Add')}
                      </button>
                    ) : (
                      <span className={s.closedBadge}>{tr('Недоступно', 'Unavailable')}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className={s.listSection}>
          <div className={s.sectionHeading}>
            <div>
              <strong>{tr('Мої друзі', 'My friends')}</strong>
              <span>{tr('Після підтвердження ви з’являєтесь у списках друзів одне одного. Теги й локальне ім’я бачиш тільки ти.', 'After confirmation, you appear in each other’s friend lists. Tags and local name are visible only to you.')}</span>
            </div>
          </div>

          {allTags.length > 0 && (
            <div className={s.filters}>
              <button type="button" className={activeTag === 'all' ? s.filterActive : ''} onClick={() => setActiveTag('all')}>{tr('Усі', 'All')} · {friends.length}</button>
              {allTags.map(tag => {
                const count = friends.filter(friend => (friend.tags || []).includes(tag)).length
                return <button type="button" key={tag} className={activeTag === tag ? s.filterActive : ''} onClick={() => setActiveTag(tag)}>{tag} · {count}</button>
              })}
            </div>
          )}

          {loading ? (
            <div className={s.loadingState}><div className="auth-spinner" />{tr('Завантажуємо друзів…', 'Loading friends…')}</div>
          ) : filteredFriends.length === 0 ? (
            <div className={s.emptyState}>
              <div><AppIcon name="friends" size={34} /></div>
              <h2>{activeTag === 'all' ? tr('Поки що тут порожньо', 'Nothing here yet') : tr('У цьому тегу немає друзів', 'No friends with this tag')}</h2>
              <p>{activeTag === 'all' ? tr('Знайди користувача за нікнеймом вище та додай його до свого кола.', 'Find a user by username above and add them to your circle.') : tr('Обери інший тег або зміни теги у налаштуваннях друга.', 'Choose another tag or edit a friend’s tags.')}</p>
            </div>
          ) : (
            <div className={s.friendsGrid}>
              {filteredFriends.map(friend => {
                const user = friend.user || {}
                const name = friend.nickname || user.display_name || user.username || tr('Користувач', 'User')
                const birthdayDays = daysUntilBirthday(user.birth_date)
                return (
                  <article className={s.friendCard} key={friend.id}>
                    <div className={s.cardTop}>
                      <UserAvatar user={user} nickname={friend.nickname} size="large" />
                      <button type="button" className={s.editButton} onClick={() => openEdit(friend)} aria-label={tr('Редагувати друга', 'Edit friend')}><AppIcon name="edit" size={16} /></button>
                    </div>
                    <div className={s.friendIdentity}>
                      <h3>{name}</h3>
                      {friend.nickname && user.display_name && <small>{user.display_name}</small>}
                      {user.username && <span>@{user.username}</span>}
                    </div>

                    <div className={s.tagsRow}>
                      {(friend.tags || []).length > 0 ? friend.tags.map(tag => <span key={tag}>{tag}</span>) : <em>{tr('Без тегів', 'No tags')}</em>}
                    </div>

                    <div className={s.friendMeta}>
                      <div><span>🎁</span><strong>{friend.accessible_lists_count || 0}</strong><small>{tr('списків', 'wishlists')}</small></div>
                      <div className={birthdayDays !== null && birthdayDays <= 7 ? s.birthdaySoon : ''}><span>🎂</span><small>{birthdayDays === null ? tr('Дата прихована', 'Date hidden') : birthdayText(birthdayDays, tr)}</small></div>
                    </div>

                    <button type="button" className={s.viewButton} onClick={() => openDetails(friend)} disabled={detailsLoading}>
                      <AppIcon name="gift" size={16} />
                      {tr('Профіль і списки', 'Profile and wishlists')}
                      <AppIcon name="arrowRight" size={15} />
                    </button>
                  </article>
                )
              })}
            </div>
          )}
        </section>

        <Footer />
      </div>

      {editFriend && (
        <Modal onClose={() => !savingEdit && setEditFriend(null)}>
          <div className={s.modalHeader}>
            <div>
              <span>{tr('НАЛАШТУВАННЯ ДРУГА', 'FRIEND SETTINGS')}</span>
              <h2>{editFriend.user?.display_name || editFriend.user?.username || tr('Користувач', 'User')}</h2>
              <p>{tr('Локальне ім’я та теги не змінюють профіль користувача й видимі лише тобі.', 'Local name and tags do not change the user’s profile and are visible only to you.')}</p>
            </div>
            <button type="button" onClick={() => setEditFriend(null)} disabled={savingEdit}><AppIcon name="close" size={18} /></button>
          </div>

          <div className={s.editProfilePreview}>
            <UserAvatar user={editFriend.user} nickname={editNickname} size="large" />
            <div><strong>{editNickname || editFriend.user?.display_name || tr('Користувач', 'User')}</strong>{editFriend.user?.username && <span>@{editFriend.user.username}</span>}</div>
          </div>

          <label className={s.field}>
            <span>{tr('Моє ім’я для цього друга', 'My name for this friend')}</span>
            <input value={editNickname} onChange={event => setEditNickname(event.target.value)} maxLength={80} placeholder={tr('Наприклад, Саша з універу', 'For example, Alex from university')} />
            <small>{tr('Якщо залишити порожнім, показуватиметься ім’я з профілю.', 'Leave empty to use the profile name.')}</small>
          </label>

          <div className={s.field}>
            <span>{tr('Теги', 'Tags')}</span>
            <div className={s.tagEditor}>
              {editTags.map(tag => <button type="button" key={tag} onClick={() => setEditTags(current => current.filter(item => item !== tag))}>{tag}<b>×</b></button>)}
              <div className={s.tagInputRow}>
                <input value={tagInput} onChange={event => setTagInput(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); addTag(tagInput) } }} maxLength={30} placeholder={tr('Новий тег', 'New tag')} />
                <button type="button" onClick={() => addTag(tagInput)}><AppIcon name="plus" size={15} /></button>
              </div>
            </div>
            <div className={s.quickTags}>{quickTags.map(tag => <button type="button" key={tag} onClick={() => addTag(tag)} disabled={editTags.some(item => item.toLowerCase() === tag.toLowerCase())}>{tag}</button>)}</div>
          </div>

          <div className={s.modalActions}>
            <button type="button" className={s.dangerButton} onClick={handleRemoveFriend} disabled={savingEdit}><AppIcon name="trash" size={16} />{tr('Видалити друга', 'Remove friend')}</button>
            <div>
              <button type="button" className="btn-outline" onClick={() => setEditFriend(null)} disabled={savingEdit}>{tr('Скасувати', 'Cancel')}</button>
              <button type="button" className="btn-primary" onClick={saveFriendSettings} disabled={savingEdit}><AppIcon name="check" size={16} />{savingEdit ? tr('Зберігаємо…', 'Saving…') : tr('Зберегти', 'Save')}</button>
            </div>
          </div>
        </Modal>
      )}

      {listView && (
        <Modal onClose={() => setListView(null)} wide>
          <div className={s.modalHeader}>
            <div>
              <span>{tr('СПИСОК ПОБАЖАНЬ', 'WISHLIST')}</span>
              <h2>{listView.emoji} {listView.title}</h2>
              <p>{tr('Зарезервуй подарунок, щоб інші бачили що його вже обрали. Власник не побачить, хто саме зарезервував.', 'Reserve a gift so others see it is taken. The owner will not see who reserved it.')}</p>
            </div>
            <button type="button" onClick={() => setListView(null)}><AppIcon name="close" size={18} /></button>
          </div>

          {listView.items.length === 0 ? (
            <div className={s.detailsEmpty}>
              <span>🎁</span>
              <strong>{tr('Список порожній', 'The list is empty')}</strong>
              <p>{tr('Тут поки немає жодного бажання.', 'There are no wishes here yet.')}</p>
            </div>
          ) : (
            <div className={s.reserveList}>
              {listView.items.map(item => {
                const reserved = item.is_reserved
                const mine = item.reserved_by_me
                return (
                  <article className={`${s.reserveItem} ${reserved ? s.reserveItemTaken : ''}`} key={item.id}>
                    <div className={s.reserveThumb}>
                      {item.image_url ? <img src={item.image_url} alt="" /> : <span>🎁</span>}
                    </div>
                    <div className={s.reserveInfo}>
                      <h4>{item.title}</h4>
                      {item.price != null && <span className={s.reservePrice}>{Number(item.price).toLocaleString(language === 'en' ? 'en-US' : 'uk-UA')} ₴</span>}
                      {item.notes && <p>{item.notes}</p>}
                      {item.url && (!reserved || mine) && <a href={item.url} target="_blank" rel="noreferrer" className={s.reserveLink}><AppIcon name="link" size={13} />{tr('Перейти до товару', 'Open product')}</a>}
                      {item.url && reserved && !mine && <span className={s.reserveLinkLocked}>🔒 {tr('Посилання приховане', 'Link hidden')}</span>}
                    </div>
                    <div className={s.reserveAction}>
                      {mine ? (
                        <>
                          <span className={s.reserveMine}><AppIcon name="check" size={13} />{tr('Ви зарезервували', 'Reserved by you')}</span>
                          <button type="button" className={s.reserveCancel} onClick={() => handleCancelReserve(item)} disabled={reservingId === item.id}>
                            {reservingId === item.id ? tr('…', '…') : tr('Скасувати', 'Cancel')}
                          </button>
                        </>
                      ) : reserved ? (
                        <span className={s.reserveTaken}>🔒 {tr('Вже зарезервовано', 'Already reserved')}</span>
                      ) : (
                        <button type="button" className={s.reserveButton} onClick={() => handleReserve(item)} disabled={reservingId === item.id}>
                          <AppIcon name="gift" size={15} />
                          {reservingId === item.id ? tr('Резервуємо…', 'Reserving…') : tr('Зарезервувати', 'Reserve')}
                        </button>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </Modal>
      )}

      {details && (
        <Modal onClose={() => setDetails(null)} wide>
          <div className={s.modalHeader}>
            <div>
              <span>{tr('ПРОФІЛЬ ДРУГА', 'FRIEND PROFILE')}</span>
              <h2>{details.nickname || details.user?.display_name || tr('Користувач', 'User')}</h2>
              <p>{tr('Тут показується лише інформація, яку користувач дозволив бачити.', 'Only information the user allowed is shown here.')}</p>
            </div>
            <button type="button" onClick={() => setDetails(null)}><AppIcon name="close" size={18} /></button>
          </div>

          <div className={s.detailsHero}>
            <UserAvatar user={details.user} nickname={details.nickname} size="large" />
            <div>
              <h3>{details.nickname || details.user?.display_name || tr('Користувач', 'User')}</h3>
              {details.nickname && details.user?.display_name && <strong>{details.user.display_name}</strong>}
              {details.user?.username && <span>@{details.user.username}</span>}
              {details.user?.birth_date && <small>🎂 {new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'uk-UA', { day: 'numeric', month: 'long' }).format(new Date(details.user.birth_date))}</small>}
            </div>
          </div>

          {(details.tags || []).length > 0 && <div className={s.detailsTags}>{details.tags.map(tag => <span key={tag}>{tag}</span>)}</div>}

          <div className={s.detailsTitle}>
            <div><strong>{tr('Доступні списки побажань', 'Visible wishlists')}</strong><span>{details.wishlists.length}</span></div>
            <small>{tr('Приватні списки тут не відображаються.', 'Private wishlists are not shown here.')}</small>
          </div>

          {details.wishlists.length === 0 ? (
            <div className={s.detailsEmpty}><span>🎁</span><strong>{tr('Немає доступних списків', 'No visible wishlists')}</strong><p>{tr('Користувач ще не створив публічний список або обмежив доступ у налаштуваннях.', 'The user has not created a visible wishlist or restricted access in settings.')}</p></div>
          ) : (
            <div className={s.wishlistGrid}>
              {details.wishlists.map(list => (
                <article className={s.wishlistCard} key={list.id} onClick={() => openListView(list.id)} style={{ cursor: 'pointer' }}>
                  <div className={s.wishlistCover}><span>{list.emoji || '🎁'}</span><b>{list.visibility === 'friends' ? tr('Друзям', 'Friends') : tr('Публічний', 'Public')}</b></div>
                  <div className={s.wishlistBody}>
                    <h4>{list.title}</h4>
                    <p>{list.items_count} {tr('бажань', 'wishes')} · {tr('натисни щоб відкрити', 'tap to open')}</p>
                    <div className={s.previewStrip}>
                      {(list.preview_items || []).length > 0 ? list.preview_items.map(item => (
                        <div key={item.id} title={item.title || ''}>{item.image_url ? <img src={item.image_url} alt="" /> : <span>🎁</span>}</div>
                      )) : <em>{tr('Список поки порожній', 'Wishlist is empty')}</em>}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}
