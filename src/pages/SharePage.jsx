import { useState, useEffect } from 'react'
import AppIcon from '../components/AppIcons'
import { getPublicList, publicReserveItem } from '../api/client'
import { useLanguage } from '../i18n/LanguageContext'
import s from './SharePage.module.css'

export default function SharePage({ listId }) {
  const { tr, language } = useLanguage()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reservingId, setReservingId] = useState('')
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => { load() }, [listId])

  async function load() {
    setLoading(true)
    setError('')
    try {
      const result = await getPublicList(listId)
      setData(result)
    } catch (e) {
      setError(e?.message || tr('Список недоступний.', 'List is not available.'))
    } finally {
      setLoading(false)
    }
  }

  async function handleReserve(item) {
    setReservingId(item.id)
    setMessage({ type: '', text: '' })
    try {
      await publicReserveItem(item.id)
      setMessage({ type: 'success', text: tr('Подарунок зарезервовано 🎁', 'Gift reserved 🎁') })
      await load()
    } catch (e) {
      setMessage({ type: 'error', text: e?.message || tr('Не вдалося зарезервувати.', 'Could not reserve.') })
    } finally {
      setReservingId('')
    }
  }

  const fmt = price => price != null ? `${Number(price).toLocaleString(language === 'en' ? 'en-US' : 'uk-UA')} ₴` : null

  return (
    <div className={s.page}>
      <header className={s.topbar}>
        <a href="/" className={s.brand}>Wishlle</a>
        <a href="/" className={s.openApp}>{tr('Відкрити застосунок', 'Open app')} →</a>
      </header>

      <main className={s.main}>
        {loading ? (
          <div className={s.center}><div className="auth-spinner" /><p>{tr('Завантажуємо список…', 'Loading list…')}</p></div>
        ) : error ? (
          <div className={s.center}>
            <div className={s.errorIcon}>🔒</div>
            <h1>{tr('Список недоступний', 'List unavailable')}</h1>
            <p>{tr('Можливо, його зробили приватним або посилання застаріле.', 'It may be private or the link is outdated.')}</p>
            <a href="/" className="btn-primary">{tr('На головну', 'Go home')}</a>
          </div>
        ) : data ? (
          <>
            <div className={s.hero}>
              <div className={s.heroEmoji}>{data.emoji}</div>
              <h1>{data.title}</h1>
              <div className={s.owner}>
                {data.owner_avatar
                  ? <img src={data.owner_avatar} alt="" className={s.ownerAvatar} />
                  : <span className={s.ownerAvatarPlaceholder}>{(data.owner_name || 'W')[0].toUpperCase()}</span>}
                <span>{tr('Список побажань від', 'Wishlist by')} <strong>{data.owner_name}</strong></span>
              </div>
              <p className={s.heroHint}>{tr('Обери подарунок і зарезервуй його, щоб інші бачили, що його вже візьмуть.', 'Pick a gift and reserve it so others know it is taken.')}</p>
            </div>

            {message.text && (
              <div className={`${s.notice} ${message.type === 'error' ? s.noticeError : s.noticeSuccess}`}>
                <span>{message.text}</span>
                <button onClick={() => setMessage({ type: '', text: '' })}>×</button>
              </div>
            )}

            {data.items.length === 0 ? (
              <div className={s.empty}><span>🎁</span><p>{tr('У цьому списку поки немає бажань.', 'This list has no wishes yet.')}</p></div>
            ) : (
              <div className={s.grid}>
                {data.items.map(item => (
                  <article className={`${s.card} ${item.is_reserved ? s.cardReserved : ''}`} key={item.id}>
                    <div className={s.cardImage}>
                      {item.image_url ? <img src={item.image_url} alt={item.title} /> : <span>🎁</span>}
                      {item.is_reserved && <div className={s.reservedTag}>🔒 {tr('Зарезервовано', 'Reserved')}</div>}
                    </div>
                    <div className={s.cardBody}>
                      <h3>{item.title}</h3>
                      {fmt(item.price) && <div className={s.cardPrice}>{fmt(item.price)}</div>}
                      {item.notes && <p className={s.cardNotes}>{item.notes}</p>}
                      <div className={s.cardActions}>
                        {item.url && !item.is_reserved && (
                          <a className={s.linkBtn} href={item.url} target="_blank" rel="noreferrer"><AppIcon name="link" size={14} /> {tr('Товар', 'Product')}</a>
                        )}
                        {item.is_reserved ? (
                          <span className={s.takenBtn}>🔒 {tr('Вже зарезервовано', 'Already reserved')}</span>
                        ) : (
                          <button type="button" className={s.reserveBtn} onClick={() => handleReserve(item)} disabled={reservingId === item.id}>
                            <AppIcon name="gift" size={15} /> {reservingId === item.id ? tr('Резервуємо…', 'Reserving…') : tr('Зарезервувати', 'Reserve')}
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            <footer className={s.footer}>
              <p>{tr('Створено у', 'Made with')} <a href="/">Wishlle</a> — {tr('твій список побажань', 'your wishlist')}</p>
            </footer>
          </>
        ) : null}
      </main>
    </div>
  )
}
