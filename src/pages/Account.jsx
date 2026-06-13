import { useEffect, useMemo, useState } from 'react'
import AppIcon from '../components/AppIcons'
import { getMe, updateMe } from '../api/client'
import s from './Account.module.css'

const EMPTY_FORM = {
  display_name: '',
  username: '',
  birth_date: '',
  avatar_url: '',
}

function initials(user) {
  const value = user?.display_name || user?.username || 'W'
  return value.split(/\s+/).filter(Boolean).map(part => part[0]).join('').slice(0, 2).toUpperCase()
}

function providerLabel(provider) {
  if (provider === 'google') return 'Google'
  if (provider === 'telegram') return 'Telegram'
  return 'Wishlle'
}

export default function Account({ user: userFromApp, onUserUpdated, onLogout }) {
  const [user, setUser] = useState(userFromApp || null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(!userFromApp)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    let cancelled = false
    const applyUser = (value) => {
      if (!value || cancelled) return
      setUser(value)
      setForm({
        display_name: value.display_name || '',
        username: value.username || '',
        birth_date: value.birth_date || '',
        avatar_url: value.avatar_url || '',
      })
    }

    if (userFromApp) applyUser(userFromApp)
    else getMe().then(applyUser).finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [userFromApp])

  const progress = useMemo(() => {
    const values = [form.display_name, form.username, form.birth_date, form.avatar_url]
    return Math.round((values.filter(value => String(value || '').trim()).length / values.length) * 100)
  }, [form])

  const dirty = useMemo(() => {
    if (!user) return false
    return Object.keys(EMPTY_FORM).some(key => (form[key] || '') !== (user[key] || ''))
  }, [form, user])

  function changeField(key, value) {
    setMessage({ type: '', text: '' })
    setForm(current => ({ ...current, [key]: value }))
  }

  async function handleSave(event) {
    event.preventDefault()
    setSaving(true)
    setMessage({ type: '', text: '' })

    try {
      const payload = {
        display_name: form.display_name.trim(),
        username: form.username.trim(),
        birth_date: form.birth_date || null,
        avatar_url: form.avatar_url.trim() || null,
      }
      const updated = await updateMe(payload)
      setUser(updated)
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
    setForm({
      display_name: user.display_name || '',
      username: user.username || '',
      birth_date: user.birth_date || '',
      avatar_url: user.avatar_url || '',
    })
    setMessage({ type: '', text: '' })
  }

  if (loading) {
    return (
      <div className={s.page}>
        <div className={s.loadingCard}><div className="auth-spinner" /><span>Завантажуємо профіль…</span></div>
      </div>
    )
  }

  return (
    <div className={s.page}>
      <div className={s.grid}>
        <aside className={s.summaryCard}>
          <div className={s.avatarWrap}>
            <div className={s.avatar}>
              {form.avatar_url
                ? <img src={form.avatar_url} alt="Аватар" referrerPolicy="no-referrer" onError={(event) => { event.currentTarget.style.display = 'none' }} />
                : <span>{initials({ ...user, ...form })}</span>}
            </div>
            <span className={s.onlineDot} title="Обліковий запис активний" />
          </div>

          <h2>{form.display_name || form.username || 'Користувач Wishlle'}</h2>
          {form.username && <p className={s.username}>@{form.username}</p>}

          <span className={s.providerBadge}>
            {user?.auth_provider === 'google' ? 'G' : user?.auth_provider === 'telegram' ? '➤' : 'W'}
            Вхід через {providerLabel(user?.auth_provider)}
          </span>

          <div className={s.completion}>
            <div className={s.completionRow}><span>Заповнення профілю</span><strong>{progress}%</strong></div>
            <div className={s.progress}><span style={{ width: `${progress}%` }} /></div>
            <p>{progress === 100 ? 'Усі основні дані заповнено.' : 'Заповнений профіль допомагає друзям швидше тебе знайти.'}</p>
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
                <div className={s.inputPrefix}><b>@</b><input
                  type="text"
                  value={form.username}
                  maxLength={50}
                  placeholder="username"
                  onChange={event => changeField('username', event.target.value.replace(/\s+/g, ''))}
                /></div>
                <small>За ним інші користувачі зможуть знайти тебе.</small>
              </label>

              <label className={s.field}>
                <span>Дата народження</span>
                <input
                  type="date"
                  value={form.birth_date}
                  onChange={event => changeField('birth_date', event.target.value)}
                />
                <small>Використовується для нагадувань друзям.</small>
              </label>

              <label className={`${s.field} ${s.fullWidth}`}>
                <span>Посилання на аватар</span>
                <div className={s.inputPrefix}><b><AppIcon name="link" size={16} /></b><input
                  type="url"
                  value={form.avatar_url}
                  placeholder="https://example.com/avatar.jpg"
                  onChange={event => changeField('avatar_url', event.target.value)}
                /></div>
                <small>Фото з Telegram або Google вже підтягується автоматично. Тут його можна замінити.</small>
              </label>
            </div>

            {message.text && (
              <div className={`${s.message} ${message.type === 'success' ? s.success : s.error}`}>
                <AppIcon name={message.type === 'success' ? 'check' : 'close'} size={17} />
                {message.text}
              </div>
            )}

            <div className={s.formActions}>
              <button type="button" className="btn-outline" disabled={!dirty || saving} onClick={resetForm}>Скасувати</button>
              <button type="submit" className="btn-primary" disabled={!dirty || saving}>
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
