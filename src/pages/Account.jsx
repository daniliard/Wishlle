import { useEffect, useMemo, useRef, useState } from 'react'
import AppIcon from '../components/AppIcons'
import { getMe, removeAvatar, updateMe, uploadAvatar } from '../api/client'
import s from './Account.module.css'

const EMPTY_FORM = {
  display_name: '',
  username: '',
  birth_date: '',
  language: 'uk',
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

export default function Account({ user: userFromApp, onUserUpdated, onLogout }) {
  const fileInputRef = useRef(null)
  const [user, setUser] = useState(userFromApp || null)
  const [form, setForm] = useState(() => normalizeUser(userFromApp))
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
      setAvatarRemoved(false)
      setAvatarBroken(false)
    }

    if (userFromApp) applyUser(userFromApp)
    else getMe().then(applyUser).catch(error => {
      if (!cancelled) setMessage({ type: 'error', text: error?.message || 'Не вдалося завантажити профіль.' })
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
    if (form.username.length < 3) return 'Нікнейм має містити щонайменше 3 символи.'
    if (!/^[a-zA-Z0-9_]+$/.test(form.username)) return 'Дозволені лише латинські літери, цифри та символ _.'
    return ''
  }, [form.username])

  const dirty = useMemo(() => {
    if (!user) return false
    const fieldsChanged = Object.keys(EMPTY_FORM).some(key => (form[key] || '') !== (normalizeUser(user)[key] || ''))
    return fieldsChanged || Boolean(avatarFile) || avatarRemoved
  }, [avatarFile, avatarRemoved, form, user])

  function changeField(key, value) {
    setMessage({ type: '', text: '' })
    setForm(current => ({ ...current, [key]: value }))
  }

  function chooseAvatar() {
    fileInputRef.current?.click()
  }

  function handleAvatarChange(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      setMessage({ type: 'error', text: 'Обери фото у форматі JPG, PNG або WEBP.' })
      return
    }
    if (file.size > MAX_AVATAR_SIZE) {
      setMessage({ type: 'error', text: 'Фото завелике. Максимальний розмір — 5 МБ.' })
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
      setUser(updated)
      setForm(normalizeUser(updated))
      onUserUpdated?.(updated)
      setMessage({ type: 'success', text: 'Профіль успішно оновлено.' })
    } catch (error) {
      setMessage({ type: 'error', text: error?.message || 'Не вдалося зберегти зміни.' })
    } finally {
      setSaving(false)
    }
  }

  function resetForm() {
    if (!user) return
    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    setForm(normalizeUser(user))
    setAvatarFile(null)
    setAvatarPreview('')
    setAvatarRemoved(false)
    setAvatarBroken(false)
    setMessage({ type: '', text: '' })
  }

  if (loading) {
    return (
      <div className={s.page}>
        <div className={s.loadingCard}><div className="auth-spinner" /><span>Завантажуємо профіль…</span></div>
      </div>
    )
  }

  const profileHint = !form.birth_date
    ? 'Додай дату народження — друзі отримають нагадування перед святом.'
    : !form.username
      ? 'Створи унікальний нікнейм, щоб друзі могли швидко тебе знайти.'
      : progress < 100
        ? 'Додай фото профілю, щоб тебе було легше впізнати у списках і подіях.'
        : 'Профіль заповнений — можна переходити до списків побажань.'

  return (
    <div className={s.page}>
      <div className={s.grid}>
        <aside className={s.summaryCard}>
          <div className={s.avatarWrap}>
            <button type="button" className={s.avatarButton} onClick={chooseAvatar} aria-label="Змінити фото профілю">
              <div className={s.avatar}>
                {shownAvatar && !avatarBroken
                  ? <img src={shownAvatar} alt="Аватар" referrerPolicy="no-referrer" onError={() => setAvatarBroken(true)} />
                  : <span>{initials({ ...user, ...form })}</span>}
              </div>
              <span className={s.cameraBadge}><AppIcon name="camera" size={16} /></span>
            </button>
            <span className={s.onlineDot} title="Обліковий запис активний" />
          </div>

          <input
            ref={fileInputRef}
            className={s.hiddenInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleAvatarChange}
          />

          <h2>{form.display_name || form.username || 'Користувач Wishlle'}</h2>
          {form.username && <p className={s.username}>@{form.username}</p>}

          <div className={s.avatarActions}>
            <button type="button" onClick={chooseAvatar}><AppIcon name="upload" size={15} /> Змінити фото</button>
            {shownAvatar && <button type="button" className={s.removeAvatar} onClick={handleAvatarRemove} aria-label="Видалити фото"><AppIcon name="trash" size={15} /></button>}
          </div>
          <p className={s.avatarNote}>JPG, PNG або WEBP · до 5 МБ</p>

          <span className={s.providerBadge}>
            {user?.auth_provider === 'google' ? 'G' : user?.auth_provider === 'telegram' ? '➤' : 'W'}
            Вхід через {providerLabel(user?.auth_provider)}
          </span>

          <div className={s.completion}>
            <div className={s.completionRow}><span>Заповнення профілю</span><strong>{progress}%</strong></div>
            <div className={s.progress}><span style={{ width: `${progress}%` }} /></div>
            <p>{profileHint}</p>
          </div>

          <div className={s.summaryDivider} />
          <div className={s.accountInfo}>
            <div><span>ID користувача</span><strong>{user?.id || '—'}</strong></div>
            <div><span>Спосіб входу</span><strong>{providerLabel(user?.auth_provider)}</strong></div>
          </div>

          <button type="button" className={s.logoutButton} onClick={onLogout}>
            <AppIcon name="logout" size={18} /> Вийти з акаунта
          </button>
        </aside>

        <section className={s.formCard}>
          <div className={s.cardHeader}>
            <div>
              <span>Особиста інформація</span>
              <h2>Налаштування профілю</h2>
              <p>Ці дані використовуються у списках друзів, подіях та спільних побажаннях.</p>
            </div>
            <div className={s.headerIcon}><AppIcon name="profile" size={23} /></div>
          </div>

          <form onSubmit={handleSave}>
            <div className={s.formGrid}>
              <label className={s.field}>
                <span>Ім’я та прізвище</span>
                <input
                  type="text"
                  value={form.display_name}
                  maxLength={100}
                  placeholder="Наприклад, Даніл Молодорич"
                  onChange={event => changeField('display_name', event.target.value)}
                />
                <small>Відображається друзям і учасникам подій.</small>
              </label>

              <label className={s.field}>
                <span>Нікнейм</span>
                <div className={`${s.inputPrefix} ${usernameError ? s.inputError : ''}`}><b>@</b><input
                  type="text"
                  value={form.username}
                  maxLength={30}
                  placeholder="username"
                  autoCapitalize="none"
                  spellCheck="false"
                  onChange={event => changeField('username', event.target.value.replace(/\s+/g, ''))}
                /></div>
                <small className={usernameError ? s.fieldError : ''}>{usernameError || 'За ним інші користувачі зможуть знайти тебе.'}</small>
              </label>

              <label className={s.field}>
                <span>Дата народження</span>
                <input
                  type="date"
                  value={form.birth_date}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={event => changeField('birth_date', event.target.value)}
                />
                <small>Використовується для нагадувань друзям.</small>
              </label>

              <label className={s.field}>
                <span>Мова інтерфейсу</span>
                <select value={form.language} onChange={event => changeField('language', event.target.value)}>
                  <option value="uk">Українська</option>
                  <option value="en">English</option>
                </select>
                <small>Налаштування мови зберігається у профілі.</small>
              </label>
            </div>

            <div className={s.privacyNote}>
              <div className={s.privacyIcon}><AppIcon name="shield" size={20} /></div>
              <div>
                <strong>Твої дані під контролем</strong>
                <p>Дата народження використовується тільки для нагадувань, а пароль від Google чи Telegram у Wishlle не зберігається.</p>
              </div>
            </div>

            {message.text && (
              <div className={`${s.message} ${message.type === 'success' ? s.success : s.error}`}>
                <AppIcon name={message.type === 'success' ? 'check' : 'close'} size={17} />
                {message.text}
              </div>
            )}

            <div className={s.formActions}>
              <button type="button" className="btn-outline" disabled={!dirty || saving} onClick={resetForm}>Скасувати</button>
              <button type="submit" className="btn-primary" disabled={!dirty || saving || Boolean(usernameError)}>
                <AppIcon name={saving ? 'sparkles' : 'check'} size={17} />
                {saving ? 'Зберігаємо…' : 'Зберегти зміни'}
              </button>
            </div>
          </form>
        </section>
      </div>

      <section className={s.securityCard}>
        <div className={s.securityIcon}><AppIcon name="userCheck" size={22} /></div>
        <div>
          <h3>Авторизація без паролів</h3>
          <p>Твій акаунт прив’язаний до {providerLabel(user?.auth_provider)}. Wishlle не зберігає пароль від Google або Telegram.</p>
        </div>
        <span className={s.secureBadge}>Захищено</span>
      </section>
    </div>
  )
}
