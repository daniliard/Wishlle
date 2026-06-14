import { useEffect, useMemo, useRef, useState } from 'react'
import AppIcon from '../components/AppIcons'
import { getMe, removeAvatar, updateMe, uploadAvatar } from '../api/client'
import { useLanguage } from '../i18n/LanguageContext'
import s from './Account.module.css'

const EMPTY_FORM = {
  display_name: '',
  username: '',
  birth_date: '',
  language: 'uk',
}

const DEFAULT_PREFERENCES = {
  privacy: {
    profile_visibility: 'friends',
    wishlists_visibility: 'friends',
    show_birth_date: true,
    show_username: true,
    searchable_by_username: true,
    allow_friend_requests: true,
  },
  notifications: {
    in_app: true,
    telegram: true,
    event_reminders: true,
    birthday_reminders: true,
    friend_requests: true,
    reservations: true,
    wishlist_updates: false,
  },
}

const MAX_AVATAR_SIZE = 5 * 1024 * 1024
const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp']

function initials(user) {
  const value = user?.display_name || user?.username || 'W'
  return value.split(/\s+/).filter(Boolean).map(part => part[0]).join('').slice(0, 2).toUpperCase()
}

function providerLabel(provider) {
  if (provider === 'google') return 'Google'
  if (provider === 'telegram') return 'Telegram'
  return 'Wishlle'
}

function normalizeUser(value) {
  return {
    display_name: value?.display_name || '',
    username: value?.username || '',
    birth_date: value?.birth_date || '',
    language: value?.language || 'uk',
  }
}

function normalizePreferences(value, hasTelegram = true) {
  const privacy = value?.privacy || {}
  const notifications = value?.notifications || {}
  return {
    privacy: { ...DEFAULT_PREFERENCES.privacy, ...privacy },
    notifications: {
      ...DEFAULT_PREFERENCES.notifications,
      ...notifications,
      telegram: hasTelegram ? (notifications.telegram ?? true) : false,
    },
  }
}


const LOCAL_SETTINGS_PREFIX = 'wishlle_local_profile_settings_'

function settingsStorageKey(userId) {
  return `${LOCAL_SETTINGS_PREFIX}${userId || 'current'}`
}

function loadLocalPreferences(userId, hasTelegram = true) {
  try {
    const raw = localStorage.getItem(settingsStorageKey(userId))
    return normalizePreferences(raw ? JSON.parse(raw) : null, hasTelegram)
  } catch {
    return normalizePreferences(null, hasTelegram)
  }
}

function saveLocalPreferences(userId, value, hasTelegram = true) {
  const normalized = normalizePreferences(value, hasTelegram)
  localStorage.setItem(settingsStorageKey(userId), JSON.stringify(normalized))
  return normalized
}

function ToggleSetting({ title, description, checked, disabled = false, onChange, badge }) {
  return (
    <div className={`${s.settingRow} ${disabled ? s.settingDisabled : ''}`}>
      <div className={s.settingCopy}>
        <div className={s.settingTitleLine}>
          <strong>{title}</strong>
          {badge && <span>{badge}</span>}
        </div>
        <p>{description}</p>
      </div>
      <button
        type="button"
        className={`${s.switch} ${checked ? s.switchOn : ''}`}
        role="switch"
        aria-checked={checked}
        aria-label={title}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
      >
        <span />
      </button>
    </div>
  )
}

export default function Account({ user: userFromApp, onUserUpdated, onLogout }) {
  const { tr, setLanguage } = useLanguage()
  const fileInputRef = useRef(null)
  const [user, setUser] = useState(userFromApp || null)
  const [form, setForm] = useState(() => normalizeUser(userFromApp))
  const [preferences, setPreferences] = useState(() => loadLocalPreferences(userFromApp?.id, userFromApp?.has_telegram !== false))
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [avatarRemoved, setAvatarRemoved] = useState(false)
  const [avatarBroken, setAvatarBroken] = useState(false)
  const [loading, setLoading] = useState(!userFromApp)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    let cancelled = false

    const applyUser = (value) => {
      if (!value || cancelled) return
      setUser(value)
      setForm(normalizeUser(value))
      setLanguage(normalizeUser(value).language)
      setPreferences(loadLocalPreferences(value.id, value.has_telegram))
      setAvatarRemoved(false)
      setAvatarBroken(false)
    }

    if (userFromApp) applyUser(userFromApp)

    getMe().then(applyUser).catch(error => {
      if (!cancelled && !userFromApp) {
        setMessage({ type: 'error', text: error?.message || tr('Не вдалося завантажити профіль.', 'Could not load profile.') })
      }
    }).finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [userFromApp])

  useEffect(() => () => {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
  }, [avatarPreview])

  const shownAvatar = avatarPreview || (!avatarRemoved ? user?.avatar_url : '')

  const progress = useMemo(() => {
    const values = [form.display_name, form.username, form.birth_date, shownAvatar]
    return Math.round((values.filter(value => String(value || '').trim()).length / values.length) * 100)
  }, [form, shownAvatar])

  const usernameError = useMemo(() => {
    if (!form.username) return ''
    if (form.username.length < 3) return tr('Нікнейм має містити щонайменше 3 символи.', 'Username must contain at least 3 characters.')
    if (!/^[a-zA-Z0-9_]+$/.test(form.username)) return tr('Дозволені лише латинські літери, цифри та символ _.', 'Only Latin letters, numbers and the underscore are allowed.')
    return ''
  }, [form.username])

  const dirty = useMemo(() => {
    if (!user) return false
    const fieldsChanged = Object.keys(EMPTY_FORM).some(key => (form[key] || '') !== (normalizeUser(user)[key] || ''))
    const preferencesChanged = JSON.stringify(preferences) !== JSON.stringify(loadLocalPreferences(user.id, user.has_telegram))
    return fieldsChanged || preferencesChanged || Boolean(avatarFile) || avatarRemoved
  }, [avatarFile, avatarRemoved, form, preferences, user])

  function changeField(key, value) {
    setMessage({ type: '', text: '' })
    setForm(current => ({ ...current, [key]: value }))
  }

  function changePreference(group, key, value) {
    setMessage({ type: '', text: '' })
    setPreferences(current => ({
      ...current,
      [group]: { ...current[group], [key]: value },
    }))
  }

  function chooseAvatar() {
    fileInputRef.current?.click()
  }

  function handleAvatarChange(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      setMessage({ type: 'error', text: tr('Обери фото у форматі JPG, PNG або WEBP.', 'Choose a JPG, PNG or WEBP image.') })
      return
    }
    if (file.size > MAX_AVATAR_SIZE) {
      setMessage({ type: 'error', text: tr('Фото завелике. Максимальний розмір — 5 МБ.', 'The image is too large. Maximum size is 5 MB.') })
      return
    }

    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
    setAvatarRemoved(false)
    setAvatarBroken(false)
    setMessage({ type: '', text: '' })
  }

  function handleAvatarRemove() {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    setAvatarFile(null)
    setAvatarPreview('')
    setAvatarRemoved(true)
    setAvatarBroken(false)
    setMessage({ type: '', text: '' })
  }

  async function handleSave(event) {
    event.preventDefault()
    if (usernameError) {
      setMessage({ type: 'error', text: usernameError })
      return
    }

    setSaving(true)
    setMessage({ type: '', text: '' })

    try {
      let updated = await updateMe({
        display_name: form.display_name.trim() || null,
        username: form.username.trim() || null,
        birth_date: form.birth_date || null,
        language: form.language,
      })

      if (avatarRemoved) updated = await removeAvatar()
      else if (avatarFile) updated = await uploadAvatar(avatarFile)

      if (avatarPreview) URL.revokeObjectURL(avatarPreview)
      setAvatarFile(null)
      setAvatarPreview('')
      setAvatarRemoved(false)
      setAvatarBroken(false)
      const savedPreferences = saveLocalPreferences(updated.id, preferences, updated.has_telegram)
      const updatedWithLocalSettings = { ...updated, preferences: savedPreferences }
      localStorage.setItem('wishlle_user', JSON.stringify(updatedWithLocalSettings))
      setUser(updatedWithLocalSettings)
      setForm(normalizeUser(updatedWithLocalSettings))
      setLanguage(normalizeUser(updatedWithLocalSettings).language)
      setPreferences(savedPreferences)
      onUserUpdated?.(updatedWithLocalSettings)
      setMessage({ type: 'success', text: tr('Профіль оновлено, локальні налаштування збережено.', 'Profile updated and local settings saved.') })
    } catch (error) {
      setMessage({ type: 'error', text: error?.message || tr('Не вдалося зберегти зміни.', 'Could not save changes.') })
    } finally {
      setSaving(false)
    }
  }

  function resetForm() {
    if (!user) return
    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    setForm(normalizeUser(user))
    setLanguage(normalizeUser(user).language)
    setPreferences(loadLocalPreferences(user.id, user.has_telegram))
    setAvatarFile(null)
    setAvatarPreview('')
    setAvatarRemoved(false)
    setAvatarBroken(false)
    setMessage({ type: '', text: '' })
  }

  if (loading) {
    return (
      <div className={s.page}>
        <div className={s.loadingCard}><div className="auth-spinner" /><span>{tr('Завантажуємо профіль…', 'Loading profile…')}</span></div>
      </div>
    )
  }

  const profileHint = !form.birth_date
    ? tr('Додай дату народження — друзі отримають нагадування перед святом.', 'Add your birth date so friends can get a reminder before the celebration.')
    : !form.username
      ? tr('Створи унікальний нікнейм, щоб друзі могли швидко тебе знайти.', 'Create a unique username so friends can find you quickly.')
      : progress < 100
        ? tr('Додай фото профілю, щоб тебе було легше впізнати у списках і подіях.', 'Add a profile photo so you are easier to recognize in lists and events.')
        : tr('Профіль заповнений — можна переходити до списків побажань.', 'Your profile is complete—you can move on to wishlists.')

  return (
    <div className={s.page}>
      <div className={s.grid}>
        <aside className={s.summaryCard}>
          <div className={s.avatarWrap}>
            <div className={s.avatar}>
              {shownAvatar && !avatarBroken
                ? <img src={shownAvatar} alt={tr('Аватар', 'Avatar')} referrerPolicy="no-referrer" onError={() => setAvatarBroken(true)} />
                : <span>{initials({ ...user, ...form })}</span>}
            </div>
            <span className={s.onlineDot} title={tr('Обліковий запис активний', 'Account is active')} />
          </div>

          <input
            ref={fileInputRef}
            className={s.hiddenInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleAvatarChange}
          />

          <h2>{form.display_name || form.username || tr('Користувач Wishlle', 'Wishlle user')}</h2>
          {form.username && <p className={s.username}>@{form.username}</p>}

          <div className={s.avatarActions}>
            <button type="button" onClick={chooseAvatar}><AppIcon name="upload" size={15} /> {tr('Змінити фото', 'Change photo')}</button>
            {shownAvatar && <button type="button" className={s.removeAvatar} onClick={handleAvatarRemove} aria-label={tr('Видалити фото', 'Remove photo')}><AppIcon name="trash" size={15} /></button>}
          </div>
          <p className={s.avatarNote}>JPG, PNG {tr('або', 'or')} WEBP · {tr('до 5 МБ', 'up to 5 MB')}</p>

          <span className={s.providerBadge}>
            {user?.auth_provider === 'google' ? 'G' : user?.auth_provider === 'telegram' ? '➤' : 'W'}
            {tr('Вхід через', 'Signed in with')} {providerLabel(user?.auth_provider)}
          </span>

          <div className={s.completion}>
            <div className={s.completionRow}><span>{tr('Заповнення профілю', 'Profile completion')}</span><strong>{progress}%</strong></div>
            <div className={s.progress}><span style={{ width: `${progress}%` }} /></div>
            <p>{profileHint}</p>
          </div>

          <div className={s.summaryDivider} />
          <div className={s.accountInfo}>
            <div><span>{tr('ID користувача', 'User ID')}</span><strong>{user?.id || '—'}</strong></div>
            <div><span>{tr('Спосіб входу', 'Sign-in method')}</span><strong>{providerLabel(user?.auth_provider)}</strong></div>
          </div>

          <button type="button" className={s.logoutButton} onClick={onLogout}>
            <AppIcon name="logout" size={18} /> {tr('Вийти з акаунта', 'Log out')}
          </button>
        </aside>

        <form className={s.settingsColumn} onSubmit={handleSave}>
          <section className={s.formCard}>
            <div className={s.cardHeader}>
              <div>
                <span>{tr('Особиста інформація', 'Personal information')}</span>
                <h2>{tr('Налаштування профілю', 'Profile settings')}</h2>
                <p>{tr('Ці дані використовуються у списках друзів, подіях та спільних побажаннях.', 'This information is used in friend lists, events and shared wishes.')}</p>
              </div>
              <div className={s.headerIcon}><AppIcon name="profile" size={23} /></div>
            </div>

            <div className={s.formGrid}>
              <label className={s.field}>
                <span>{tr('Ім’я та прізвище', 'Full name')}</span>
                <input
                  type="text"
                  value={form.display_name}
                  maxLength={100}
                  placeholder={tr('Наприклад, Даніл Молодорич', 'For example, Dan Molodorych')}
                  onChange={event => changeField('display_name', event.target.value)}
                />
                <small>{tr('Відображається друзям і учасникам подій.', 'Shown to friends and event participants.')}</small>
              </label>

              <label className={s.field}>
                <span>{tr('Нікнейм', 'Username')}</span>
                <div className={`${s.inputPrefix} ${usernameError ? s.inputError : ''}`}><b>@</b><input
                  type="text"
                  value={form.username}
                  maxLength={30}
                  placeholder="username"
                  autoCapitalize="none"
                  spellCheck="false"
                  onChange={event => changeField('username', event.target.value.replace(/\s+/g, ''))}
                /></div>
                <small className={usernameError ? s.fieldError : ''}>{usernameError || tr('За ним інші користувачі зможуть знайти тебе.', 'Other users will be able to find you by it.')}</small>
              </label>

              <label className={s.field}>
                <span>{tr('Дата народження', 'Birth date')}</span>
                <input
                  type="date"
                  value={form.birth_date}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={event => changeField('birth_date', event.target.value)}
                />
                <small>{tr('Використовується для нагадувань друзям.', 'Used for reminders to friends.')}</small>
              </label>

              <label className={s.field}>
                <span>{tr('Мова інтерфейсу', 'Interface language')}</span>
                <select value={form.language} onChange={event => { changeField('language', event.target.value); setLanguage(event.target.value) }}>
                  <option value="uk">Українська</option>
                  <option value="en">English</option>
                </select>
                <small>{tr('Налаштування мови зберігається у профілі.', 'The language setting is saved in your profile.')}</small>
              </label>
            </div>
          </section>

          <section className={s.formCard}>
            <div className={s.cardHeader}>
              <div>
                <span>{tr('Приватність', 'Privacy')}</span>
                <h2>{tr('Хто бачить твої дані', 'Who can see your information')}</h2>
                <p>{tr('Обери, яку інформацію можуть переглядати інші користувачі Wishlle.', 'Choose what information other Wishlle users can view.')}</p>
              </div>
              <div className={s.headerIcon}><AppIcon name="shield" size={23} /></div>
            </div>

            <div className={s.visibilityGrid}>
              <label className={s.field}>
                <span>{tr('Видимість профілю', 'Profile visibility')}</span>
                <select
                  value={preferences.privacy.profile_visibility}
                  onChange={event => changePreference('privacy', 'profile_visibility', event.target.value)}
                >
                  <option value="public">{tr('Усі користувачі', 'All users')}</option>
                  <option value="friends">{tr('Лише друзі', 'Friends only')}</option>
                  <option value="private">{tr('Тільки я', 'Only me')}</option>
                </select>
                <small>{tr('Визначає, хто може відкрити сторінку твого профілю.', 'Controls who can open your profile page.')}</small>
              </label>

              <label className={s.field}>
                <span>{tr('Видимість списків побажань', 'Wishlist visibility')}</span>
                <select
                  value={preferences.privacy.wishlists_visibility}
                  onChange={event => changePreference('privacy', 'wishlists_visibility', event.target.value)}
                >
                  <option value="public">{tr('Усі користувачі', 'All users')}</option>
                  <option value="friends">{tr('Лише друзі', 'Friends only')}</option>
                  <option value="private">{tr('Тільки я', 'Only me')}</option>
                </select>
                <small>{tr('Окремий список надалі зможе мати власне налаштування доступу.', 'Each list can also have its own access setting.')}</small>
              </label>
            </div>

            <div className={s.settingsList}>
              <ToggleSetting
                title={tr('Показувати дату народження', 'Show birth date')}
                description={tr('Друзі бачитимуть дату та зможуть отримувати нагадування.', 'Friends will see the date and can receive reminders.')}
                checked={preferences.privacy.show_birth_date}
                onChange={value => changePreference('privacy', 'show_birth_date', value)}
              />
              <ToggleSetting
                title={tr('Показувати нікнейм', 'Show username')}
                description={tr('Нікнейм відображатиметься у профілі, списках друзів і подіях.', 'Your username will appear in the profile, friend lists and events.')}
                checked={preferences.privacy.show_username}
                onChange={value => changePreference('privacy', 'show_username', value)}
              />
              <ToggleSetting
                title={tr('Дозволити пошук за нікнеймом', 'Allow search by username')}
                description={tr('Інші користувачі зможуть знайти тебе через пошук Wishlle.', 'Other users will be able to find you through Wishlle search.')}
                checked={preferences.privacy.searchable_by_username}
                onChange={value => changePreference('privacy', 'searchable_by_username', value)}
              />
              <ToggleSetting
                title={tr('Дозволити запити в друзі', 'Allow friend requests')}
                description={tr('Користувачі зможуть надсилати тобі запрошення до списку друзів.', 'Users will be able to send you friend requests.')}
                checked={preferences.privacy.allow_friend_requests}
                onChange={value => changePreference('privacy', 'allow_friend_requests', value)}
              />
            </div>
          </section>

          <section className={s.formCard}>
            <div className={s.cardHeader}>
              <div>
                <span>{tr('Сповіщення', 'Notifications')}</span>
                <h2>{tr('Що тобі нагадувати', 'What to notify you about')}</h2>
                <p>{tr('Налаштуй події, про які Wishlle має повідомляти в застосунку або Telegram.', 'Choose which events Wishlle should notify you about in the app or Telegram.')}</p>
              </div>
              <div className={s.headerIcon}><AppIcon name="bell" size={23} /></div>
            </div>

            <div className={s.settingsList}>
              <ToggleSetting
                title={tr('Сповіщення в застосунку', 'In-app notifications')}
                description={tr('Показувати нові повідомлення у центрі сповіщень Wishlle.', 'Show new messages in the Wishlle notification center.')}
                checked={preferences.notifications.in_app}
                onChange={value => changePreference('notifications', 'in_app', value)}
              />
              <ToggleSetting
                title={tr('Сповіщення в Telegram', 'Telegram notifications')}
                description={user?.has_telegram ? tr('Надсилати активні нагадування через бота Wishlle.', 'Send active reminders through the Wishlle bot.') : tr('Доступно після входу або прив’язки Telegram.', 'Available after signing in with or linking Telegram.')}
                badge={user?.has_telegram ? tr('Підключено', 'Connected') : tr('Не підключено', 'Not connected')}
                checked={preferences.notifications.telegram}
                disabled={!user?.has_telegram}
                onChange={value => changePreference('notifications', 'telegram', value)}
              />
              <ToggleSetting
                title={tr('Нагадування про події', 'Event reminders')}
                description={tr('Повідомляти перед створеними подіями та святами.', 'Notify before created events and celebrations.')}
                checked={preferences.notifications.event_reminders}
                onChange={value => changePreference('notifications', 'event_reminders', value)}
              />
              <ToggleSetting
                title={tr('Дні народження друзів', 'Friends’ birthdays')}
                description={tr('Нагадувати про найближчі дні народження користувачів у друзях.', 'Remind you about upcoming birthdays of friends.')}
                checked={preferences.notifications.birthday_reminders}
                onChange={value => changePreference('notifications', 'birthday_reminders', value)}
              />
              <ToggleSetting
                title={tr('Запити в друзі', 'Friend requests')}
                description={tr('Повідомляти про нові запрошення та зміни їхнього статусу.', 'Notify about new invitations and status changes.')}
                checked={preferences.notifications.friend_requests}
                onChange={value => changePreference('notifications', 'friend_requests', value)}
              />
              <ToggleSetting
                title={tr('Резервування подарунків', 'Gift reservations')}
                description={tr('Повідомляти про зміну статусу товарів у твоїх списках без розкриття сюрпризу.', 'Notify about item status changes in your lists without revealing the surprise.')}
                checked={preferences.notifications.reservations}
                onChange={value => changePreference('notifications', 'reservations', value)}
              />
              <ToggleSetting
                title={tr('Оновлення списків друзів', 'Friends’ list updates')}
                description={tr('Повідомляти, коли друзі додають нові бажання до доступних списків.', 'Notify when friends add new wishes to visible lists.')}
                checked={preferences.notifications.wishlist_updates}
                onChange={value => changePreference('notifications', 'wishlist_updates', value)}
              />
            </div>
          </section>

          <section className={s.saveCard}>
            <div className={s.saveInfo}>
              <AppIcon name="shield" size={20} />
              <div>
                <strong>{tr('Профіль зберігається в акаунті', 'Your profile is saved to your account')}</strong>
                <p>{tr('Мова та дані профілю синхронізуються. Перемикачі приватності й сповіщень поки зберігаються лише на цьому пристрої.', 'Language and profile data are synced. Privacy and notification toggles are currently saved only on this device.')}</p>
              </div>
            </div>

            {message.text && (
              <div className={`${s.message} ${message.type === 'success' ? s.success : s.error}`}>
                <AppIcon name={message.type === 'success' ? 'check' : 'close'} size={17} />
                {message.text}
              </div>
            )}

            <div className={s.formActions}>
              <button type="button" className="btn-outline" disabled={!dirty || saving} onClick={resetForm}>{tr('Скасувати', 'Cancel')}</button>
              <button type="submit" className="btn-primary" disabled={!dirty || saving || Boolean(usernameError)}>
                <AppIcon name={saving ? 'sparkles' : 'check'} size={17} />
                {saving ? tr('Зберігаємо…', 'Saving…') : tr('Зберегти зміни', 'Save changes')}
              </button>
            </div>
          </section>
        </form>
      </div>

      <section className={s.securityCard}>
        <div className={s.securityIcon}><AppIcon name="userCheck" size={22} /></div>
        <div>
          <h3>{tr('Авторизація без паролів', 'Passwordless authentication')}</h3>
          <p>{tr('Твій акаунт прив’язаний до', 'Your account is linked to')} {providerLabel(user?.auth_provider)}. {tr('Wishlle не зберігає пароль від Google або Telegram.', 'Wishlle does not store your Google or Telegram password.')}</p>
        </div>
        <span className={s.secureBadge}>{tr('Захищено', 'Protected')}</span>
      </section>
    </div>
  )
}
