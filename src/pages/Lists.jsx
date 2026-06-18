import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import AppIcon from '../components/AppIcons'
import Footer from '../components/Footer'
import {
  createItem,
  createList,
  deleteItem,
  deleteList,
  getListItems,
  getMyLists,
  getShareUrl,
  parseUrl,
  updateItem,
  updateList,
  uploadCover,
} from '../api/client'
import { useLanguage } from '../i18n/LanguageContext'
import s from './Lists.module.css'

const EMOJIS = ['🎁', '🎂', '🎮', '💻', '✈️', '🏠', '👟', '📚', '🎧', '✨']

function listVisibility(list) {
  if (['public', 'friends', 'private'].includes(list?.visibility)) return list.visibility
  return list?.is_public === false ? 'private' : 'public'
}

function visibilityMeta(value, tr) {
  if (value === 'friends') return { icon: '👥', label: tr('Для друзів', 'Friends only') }
  if (value === 'private') return { icon: '🔒', label: tr('Приватний', 'Private') }
  return { icon: '🌍', label: tr('Публічний', 'Public') }
}
function formatDate(value, locale, tr) {
  if (!value) return tr('Щойно створено', 'Just created')
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return tr('Нещодавно оновлено', 'Recently updated')
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(date)
}

function formatPrice(value, locale) {
  if (value === null || value === undefined || value === '') return ''
  const amount = Number(value)
  if (Number.isNaN(amount)) return ''
  return `${amount.toLocaleString(locale)} ₴`
}

function ModalShell({ title, subtitle, onClose, children, wide = false }) {
  const { tr } = useLanguage()
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous }
  }, [])

  return createPortal(
    <div className={s.modalBackdrop} onMouseDown={event => event.target === event.currentTarget && onClose()}>
      <div className={`${s.modal} ${wide ? s.modalWide : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className={s.modalHeader}>
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button type="button" className={s.iconButton} onClick={onClose} aria-label={tr('Закрити', 'Close')}>
            <AppIcon name="close" size={19} />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}

function isImageCover(value) {
  return /^(https?:\/\/|\/backend\/|data:image\/|blob:)/i.test(String(value || '').trim())
}

function ListCover({ value, className = '' }) {
  const cover = String(value || '').trim()
  return isImageCover(cover)
    ? <img className={className} src={cover} alt="" />
    : <span className={className}>{cover || '🎁'}</span>
}

function ListModal({ list, onClose, onSave }) {
  const { tr } = useLanguage()
  const initialCover = list?.emoji || '🎁'
  const [form, setForm] = useState({
    title: list?.title || '',
    emoji: initialCover,
    visibility: listVisibility(list),
  })
  const [coverFile, setCoverFile] = useState(null)
  const [coverPreview, setCoverPreview] = useState(isImageCover(initialCover) ? initialCover : '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => () => {
    if (coverPreview?.startsWith('blob:')) URL.revokeObjectURL(coverPreview)
  }, [coverPreview])

  function chooseEmoji(emoji) {
    if (coverPreview?.startsWith('blob:')) URL.revokeObjectURL(coverPreview)
    setCoverFile(null)
    setCoverPreview('')
    setForm(current => ({ ...current, emoji }))
  }

  function chooseCover(event) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError(tr('Підтримуються лише JPG, PNG та WEBP.', 'Only JPG, PNG and WEBP are supported.'))
      event.target.value = ''
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      setError(tr('Зображення завелике. Максимум — 8 МБ.', 'The image is too large. Maximum size is 8 MB.'))
      event.target.value = ''
      return
    }
    if (coverPreview?.startsWith('blob:')) URL.revokeObjectURL(coverPreview)
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
    setError('')
    event.target.value = ''
  }

  async function submit(event) {
    event.preventDefault()
    if (!form.title.trim()) {
      setError(tr('Вкажи назву списку.', 'Enter a list name.'))
      return
    }
    setSaving(true)
    setError('')
    try {
      let cover = form.emoji || '🎁'
      if (coverFile) {
        const uploaded = await uploadCover(coverFile)
        cover = uploaded.url
      }
      await onSave({ ...form, emoji: cover, title: form.title.trim() })
    } catch (requestError) {
      setError(requestError?.message || tr('Не вдалося зберегти список.', 'Could not save the list.'))
    } finally {
      setSaving(false)
    }
  }

  const image = coverPreview || (isImageCover(form.emoji) ? form.emoji : '')

  return (
    <ModalShell
      title={list ? tr('Редагувати список', 'Edit list') : tr('Створити новий список', 'Create a new list')}
      subtitle={tr('Дай списку зрозумілу назву, обкладинку та обери, хто зможе його бачити.', 'Give the list a clear name, cover and choose who can see it.')}
      onClose={onClose}
    >
      <form onSubmit={submit} className={s.modalForm}>
        <label className={s.field}>
          <span>{tr('Назва списку', 'List name')}</span>
          <input autoFocus value={form.title} maxLength={120} placeholder={tr('Наприклад, Подарунки на день народження', 'For example, Birthday gifts')} onChange={event => setForm(current => ({ ...current, title: event.target.value }))} />
        </label>

        <div className={s.field}>
          <span>{tr('Обкладинка', 'Cover')}</span>
          {image && (
            <div className={s.listCoverPreview}>
              <img src={image} alt={tr('Обкладинка списку', 'List cover')} />
              <button type="button" onClick={() => chooseEmoji('🎁')}>{tr('Прибрати фото', 'Remove photo')}</button>
            </div>
          )}
          <div className={s.listCoverControls}>
            <div className={s.emojiPicker}>
              {EMOJIS.map(emoji => (
                <button type="button" key={emoji} className={!image && form.emoji === emoji ? s.emojiActive : ''} onClick={() => chooseEmoji(emoji)} aria-label={`${tr('Обрати', 'Choose')} ${emoji}`}>
                  {emoji}
                </button>
              ))}
            </div>
            <label className={s.coverUploadButton}>
              <AppIcon name="upload" size={15} /> {tr('Завантажити фото', 'Upload image')}
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseCover} />
            </label>
          </div>
          <small className={s.coverHint}>{tr('Можна залишити емодзі або завантажити JPG, PNG чи WEBP до 8 МБ.', 'Keep an emoji or upload a JPG, PNG or WEBP up to 8 MB.')}</small>
        </div>

        <div className={s.field}>
          <span>{tr('Видимість', 'Visibility')}</span>
          <div className={s.visibilityOptions}>
            <button type="button" className={form.visibility === 'public' ? s.visibilityActive : ''} onClick={() => setForm(current => ({ ...current, visibility: 'public' }))}><span>🌍</span><div><strong>{tr('Публічний', 'Public')}</strong><small>{tr('Доступний усім користувачам', 'Visible to all users')}</small></div></button>
            <button type="button" className={form.visibility === 'friends' ? s.visibilityActive : ''} onClick={() => setForm(current => ({ ...current, visibility: 'friends' }))}><span>👥</span><div><strong>{tr('Для друзів', 'Friends only')}</strong><small>{tr('Відкривається лише підтвердженим друзям', 'Visible only to confirmed friends')}</small></div></button>
            <button type="button" className={form.visibility === 'private' ? s.visibilityActive : ''} onClick={() => setForm(current => ({ ...current, visibility: 'private' }))}><span>🔒</span><div><strong>{tr('Приватний', 'Private')}</strong><small>{tr('Список бачиш лише ти', 'Only you can see this list')}</small></div></button>
          </div>
        </div>

        {error && <div className={s.errorBox}>{error}</div>}
        <div className={s.modalActions}>
          <button type="button" className="btn-outline" onClick={onClose} disabled={saving}>{tr('Скасувати', 'Cancel')}</button>
          <button type="submit" className="btn-primary" disabled={saving}><AppIcon name={saving ? 'sparkles' : 'check'} size={17} />{saving ? tr('Зберігаємо…', 'Saving…') : list ? tr('Зберегти зміни', 'Save changes') : tr('Створити список', 'Create list')}</button>
        </div>
      </form>
    </ModalShell>
  )
}

function ItemModal({ item, onClose, onSave }) {
  const { tr, locale } = useLanguage()
  const [form, setForm] = useState({
    title: item?.title || '',
    url: item?.url || '',
    price: item?.price ?? '',
    image_url: item?.image_url || '',
    notes: item?.notes || '',
  })
  const [parsing, setParsing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [imageBroken, setImageBroken] = useState(false)

  async function fillFromUrl() {
    if (!form.url.trim()) {
      setError(tr('Спочатку встав посилання на товар.', 'Paste the product link first.'))
      return
    }
    setParsing(true)
    setError('')
    try {
      const data = await parseUrl(form.url.trim())
      setForm(current => ({
        ...current,
        title: data?.title || current.title,
        price: data?.price ?? current.price,
        image_url: data?.image || current.image_url,
      }))
      setImageBroken(false)
    } catch (requestError) {
      setError(requestError?.message || tr('Не вдалося отримати дані за посиланням. Заповни поля вручну.', 'Could not get data from the link. Fill in the fields manually.'))
    } finally {
      setParsing(false)
    }
  }

  async function submit(event) {
    event.preventDefault()
    if (!form.title.trim()) {
      setError(tr('Вкажи назву бажання.', 'Enter a wish name.'))
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSave({
        title: form.title.trim(),
        url: form.url.trim() || null,
        price: form.price === '' ? null : Number(form.price),
        image_url: form.image_url.trim() || null,
        notes: form.notes.trim() || null,
      })
    } catch (requestError) {
      setError(requestError?.message || tr('Не вдалося зберегти бажання.', 'Could not save the wish.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalShell
      title={item ? tr('Редагувати бажання', 'Edit wish') : tr('Додати бажання', 'Add wish')}
      subtitle={tr('Встав посилання для автозаповнення або внеси інформацію вручну.', 'Paste a link for autofill or enter the information manually.')}
      onClose={onClose}
    >
      <form onSubmit={submit} className={s.modalForm}>
        <label className={s.field}>
          <span>{tr('Посилання на товар', 'Product link')}</span>
          <div className={s.urlRow}>
            <div className={s.inputWithIcon}>
              <AppIcon name="link" size={17} />
              <input
                value={form.url}
                placeholder="https://shop.example.com/product"
                onChange={event => setForm(current => ({ ...current, url: event.target.value }))}
              />
            </div>
            <button type="button" className={s.autoButton} onClick={fillFromUrl} disabled={parsing}>
              <AppIcon name="sparkles" size={16} /> {parsing ? tr('Чекай…', 'Please wait…') : tr('Заповнити', 'Autofill')}
            </button>
          </div>
        </label>

        <div className={s.itemFormGrid}>
          <div className={s.previewBox}>
            {form.image_url && !imageBroken
              ? <img src={form.image_url} alt={tr('Прев’ю товару', 'Product preview')} onError={() => setImageBroken(true)} />
              : <div><AppIcon name="gift" size={34} /><span>{tr('Фото підтягнеться з посилання', 'The image will be loaded from the link')}</span></div>}
          </div>
          <div className={s.itemFields}>
            <label className={s.field}>
              <span>{tr('Назва', 'Name')}</span>
              <input
                value={form.title}
                maxLength={180}
                placeholder={tr('Наприклад, Навушники Sony', 'For example, Sony headphones')}
                onChange={event => setForm(current => ({ ...current, title: event.target.value }))}
              />
            </label>
            <label className={s.field}>
              <span>{tr('Орієнтовна ціна, ₴', 'Estimated price, ₴')}</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                placeholder="0"
                onChange={event => setForm(current => ({ ...current, price: event.target.value }))}
              />
            </label>
          </div>
        </div>

        <label className={s.field}>
          <span>{tr('Коментар', 'Note')}</span>
          <textarea
            rows="3"
            maxLength={1000}
            value={form.notes}
            placeholder={tr('Колір, розмір, модель або інші деталі', 'Color, size, model or other details')}
            onChange={event => setForm(current => ({ ...current, notes: event.target.value }))}
          />
        </label>

        {error && <div className={s.errorBox}>{error}</div>}

        <div className={s.modalActions}>
          <button type="button" className="btn-outline" onClick={onClose}>{tr('Скасувати', 'Cancel')}</button>
          <button type="submit" className="btn-primary" disabled={saving}>
            <AppIcon name={saving ? 'sparkles' : 'check'} size={17} />
            {saving ? tr('Зберігаємо…', 'Saving…') : item ? tr('Зберегти зміни', 'Save changes') : tr('Додати бажання', 'Add wish')}
          </button>
        </div>
      </form>
    </ModalShell>
  )
}

function ItemDetailModal({ item, onClose, onEdit, onDelete }) {
  const { tr, locale } = useLanguage()
  return (
    <ModalShell title={item.title} subtitle={tr('Детальна інформація про бажання', 'Wish details')} onClose={onClose} wide>
      <div className={s.itemDetail}>
        <div className={s.itemDetailImage}>
          {item.image_url ? <img src={item.image_url} alt={item.title} /> : <AppIcon name="gift" size={54} />}
          <span className={`${s.itemStatus} ${item.status === 'reserved' ? s.statusReserved : s.statusAvailable}`}>
            {item.status === 'reserved' ? tr('Заброньовано', 'Reserved') : item.status === 'purchased' ? tr('Придбано', 'Purchased') : tr('Доступно', 'Available')}
          </span>
        </div>
        <div className={s.itemDetailBody}>
          <div className={s.itemDetailTitle}>
            <h3>{item.title}</h3>
            {item.price !== null && item.price !== undefined && <strong>{formatPrice(item.price, locale)}</strong>}
          </div>
          {item.notes ? <p>{item.notes}</p> : <p className={s.mutedDetail}>{tr('Коментар не додано.', 'No note added.')}</p>}
          {item.url && <a className={s.productLink} href={item.url} target="_blank" rel="noreferrer"><AppIcon name="link" size={16} /> {tr('Відкрити сторінку товару', 'Open product page')}</a>}
          <div className={s.itemDetailActions}>
            <button type="button" className="btn-outline" onClick={onEdit}><AppIcon name="edit" size={16} /> {tr('Редагувати', 'Edit')}</button>
            <button type="button" className={s.deleteDetailButton} onClick={onDelete}><AppIcon name="trash" size={16} /> {tr('Видалити', 'Delete')}</button>
          </div>
        </div>
      </div>
    </ModalShell>
  )
}

function Stats({ lists }) {
  const { tr, locale } = useLanguage()
  const totalItems = lists.reduce((sum, list) => sum + Number(list.items_count || 0), 0)
  const publicCount = lists.filter(list => listVisibility(list) === 'public').length
  const friendsCount = lists.filter(list => listVisibility(list) === 'friends').length
  const privateCount = lists.filter(list => listVisibility(list) === 'private').length
  const cards = [
    { icon: 'lists', value: lists.length, label: tr('списків', 'lists') },
    { icon: 'gift', value: totalItems, label: tr('бажань', 'wishes') },
    { icon: 'friends', value: friendsCount, label: tr('для друзів', 'friends only') },
    { icon: 'shield', value: privateCount, label: tr('приватних', 'private') },
  ]

  return (
    <div className={s.statsGrid}>
      {cards.map(card => (
        <div className={s.statCard} key={card.label}>
          <span><AppIcon name={card.icon} size={20} /></span>
          <div><strong>{card.value}</strong><small>{card.label}</small></div>
        </div>
      ))}
    </div>
  )
}

function ListCard({ list, onOpen, onEdit, onDelete }) {
  const { tr, locale } = useLanguage()
  const preview = Array.isArray(list.preview_items) ? list.preview_items.slice(0, 4) : []
  return (
    <article className={s.listCard} onClick={onOpen} tabIndex="0" onKeyDown={event => event.key === 'Enter' && onOpen()}>
      <div className={s.listCover}>
        <div className={s.coverGlow} />
        <ListCover value={list.emoji} className={s.listEmoji} />
        {(() => {
          const visibility = listVisibility(list)
          const meta = visibilityMeta(visibility, tr)
          return <span className={`${s.visibilityBadge} ${visibility === 'public' ? s.publicBadge : visibility === 'friends' ? s.friendsBadge : s.privateBadge}`}>{meta.icon} {meta.label}</span>
        })()}
      </div>
      <div className={s.listBody}>
        <div className={s.listTitleRow}>
          <div>
            <h3>{list.title}</h3>
            <p>{formatDate(list.date_created, locale, tr)}</p>
          </div>
          <div className={s.cardActions}>
            <button type="button" onClick={event => { event.stopPropagation(); onEdit() }} aria-label={tr('Редагувати список', 'Edit list')}>
              <AppIcon name="edit" size={16} />
            </button>
            <button type="button" className={s.dangerButton} onClick={event => { event.stopPropagation(); onDelete() }} aria-label={tr('Видалити список', 'Delete list')}>
              <AppIcon name="trash" size={16} />
            </button>
          </div>
        </div>

        <div className={s.previewStrip}>
          {preview.length > 0 ? preview.map((item, index) => (
            <div className={s.previewItem} key={item.id || index} title={item.title}>
              {item.image_url ? <img src={item.image_url} alt="" /> : <AppIcon name="gift" size={16} />}
            </div>
          )) : (
            <div className={s.emptyPreview}><AppIcon name="gift" size={17} /> {tr('Додай перше бажання', 'Add the first wish')}</div>
          )}
        </div>

        <div className={s.listBottom}>
          <div className={s.countGroup}>
            <strong>{list.items_count || 0}</strong><span>{tr('бажань', 'wishes')}</span>
            {Number(list.reserved_count || 0) > 0 && <em>{list.reserved_count} {tr('заброньовано', 'reserved')}</em>}
          </div>
          <span className={s.openHint}>{tr('Відкрити', 'Open')} <AppIcon name="arrowRight" size={15} /></span>
        </div>
      </div>
    </article>
  )
}

function ShareButton({ listId }) {
  const { tr } = useLanguage()
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    const url = getShareUrl(listId)
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Wishlle', url })
        return
      }
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Якщо clipboard недоступний — показуємо prompt
      window.prompt(tr('Скопіюй посилання:', 'Copy the link:'), url)
    }
  }

  return (
    <button type="button" className="btn-outline" onClick={handleShare}>
      <AppIcon name={copied ? 'check' : 'link'} size={16} />
      {copied ? tr('Скопійовано!', 'Copied!') : tr('Поділитися', 'Share')}
    </button>
  )
}

function WishlistDetail({ list, items, loading, onBack, onAdd, onEditList, onOpenItem, onEditItem, onDeleteItem }) {
  const { tr, locale } = useLanguage()
  return (
    <div className={s.detailPage}>
      <div className={s.detailHeader}>
        <button type="button" className={s.backButton} onClick={onBack}>
          <AppIcon name="arrowLeft" size={18} /> {tr('Назад до списків', 'Back to lists')}
        </button>
        <div className={s.detailActions}>
          {listVisibility(list) === 'public' && <ShareButton listId={list.id} />}
          <button type="button" className="btn-outline" onClick={onEditList}><AppIcon name="edit" size={16} /> {tr('Редагувати', 'Edit')}</button>
          <button type="button" className="btn-primary" onClick={onAdd}><AppIcon name="plus" size={17} /> {tr('Додати бажання', 'Add wish')}</button>
        </div>
      </div>

      <section className={s.detailHero}>
        <div className={`${s.detailEmoji} ${isImageCover(list.emoji) ? s.detailImageCover : ''}`}><ListCover value={list.emoji} /></div>
        <div className={s.detailCopy}>
          {(() => {
            const visibility = listVisibility(list)
            const meta = visibilityMeta(visibility, tr)
            return <span className={visibility === 'public' ? s.detailPublic : visibility === 'friends' ? s.detailFriends : s.detailPrivate}>{meta.icon} {meta.label}</span>
          })()}
          <h1>{list.title}</h1>
          <p>{items.length} {items.length === 1 ? tr('бажання', 'wish') : tr('бажань', 'wishes')} · {tr('створено', 'created')} {formatDate(list.date_created, locale, tr).toLowerCase()}</p>
        </div>
      </section>

      {loading ? (
        <div className={s.loadingState}><div className="auth-spinner" /><span>{tr('Завантажуємо бажання…', 'Loading wishes…')}</span></div>
      ) : items.length === 0 ? (
        <div className={s.emptyState}>
          <div className={s.emptyIcon}><AppIcon name="gift" size={36} /></div>
          <h2>{tr('У цьому списку ще порожньо', 'This list is still empty')}</h2>
          <p>{tr('Додай товар вручну або встав посилання — Wishlle спробує підтягнути назву, ціну та фото.', 'Add an item manually or paste a link—Wishlle will try to fetch the name, price and image.')}</p>
          <button type="button" className="btn-primary" onClick={onAdd}><AppIcon name="plus" size={17} /> {tr('Додати перше бажання', 'Add the first wish')}</button>
        </div>
      ) : (
        <div className={s.itemsGrid}>
          {items.map(item => (
            <article className={s.itemCard} key={item.id} onClick={() => onOpenItem(item)} tabIndex="0" onKeyDown={event => event.key === 'Enter' && onOpenItem(item)}>
              <div className={s.itemImage}>
                {item.image_url ? <img src={item.image_url} alt={item.title} /> : <AppIcon name="gift" size={36} />}
                <span className={`${s.itemStatus} ${item.status === 'reserved' ? s.statusReserved : s.statusAvailable}`}>
                  {item.status === 'reserved' ? tr('Заброньовано', 'Reserved') : item.status === 'purchased' ? tr('Придбано', 'Purchased') : tr('Доступно', 'Available')}
                </span>
              </div>
              <div className={s.itemBody}>
                <div className={s.itemTop}>
                  <h3>{item.title}</h3>
                  {item.price !== null && item.price !== undefined && <strong>{formatPrice(item.price, locale)}</strong>}
                </div>
                {item.notes && <p>{item.notes}</p>}
                <div className={s.itemFooter}>
                  {item.url ? (
                    <a href={item.url} target="_blank" rel="noreferrer"><AppIcon name="link" size={15} /> {tr('Перейти до товару', 'Open product')}</a>
                  ) : <span className={s.noLink}>{tr('Без посилання', 'No link')}</span>}
                  <div>
                    <button type="button" onClick={event => { event.stopPropagation(); onEditItem(item) }} aria-label={tr('Редагувати', 'Edit')}><AppIcon name="edit" size={16} /></button>
                    <button type="button" className={s.dangerButton} onClick={event => { event.stopPropagation(); onDeleteItem(item) }} aria-label={tr('Видалити', 'Delete')}><AppIcon name="trash" size={16} /></button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Lists() {
  const { tr, locale } = useLanguage()
  const filters = [
    { value: 'all', label: tr('Усі списки', 'All lists') },
    { value: 'public', label: tr('Публічні', 'Public') },
    { value: 'friends', label: tr('Для друзів', 'Friends only') },
    { value: 'private', label: tr('Приватні', 'Private') },
  ]
  const [lists, setLists] = useState([])
  const [items, setItems] = useState([])
  const [selectedList, setSelectedList] = useState(null)
  const [loading, setLoading] = useState(true)
  const [itemsLoading, setItemsLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [listModal, setListModal] = useState(null)
  const [itemModal, setItemModal] = useState(null)
  const [viewItem, setViewItem] = useState(null)

  async function loadLists() {
    setLoading(true)
    setError('')
    try {
      const data = await getMyLists()
      setLists(Array.isArray(data) ? data : [])
      if (selectedList) {
        const refreshed = (Array.isArray(data) ? data : []).find(entry => String(entry.id) === String(selectedList.id))
        if (refreshed) setSelectedList(refreshed)
      }
    } catch (requestError) {
      setError(requestError?.message || tr('Не вдалося завантажити списки.', 'Could not load lists.'))
    } finally {
      setLoading(false)
    }
  }

  async function loadItems(list) {
    setItemsLoading(true)
    setError('')
    try {
      const data = await getListItems(list.id)
      setItems(Array.isArray(data) ? data : [])
    } catch (requestError) {
      setError(requestError?.message || tr('Не вдалося завантажити бажання.', 'Could not load wishes.'))
      setItems([])
    } finally {
      setItemsLoading(false)
    }
  }

  useEffect(() => { loadLists() }, [])

  async function openList(list) {
    setSelectedList(list)
    setItems([])
    await loadItems(list)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function saveList(payload) {
    if (listModal?.id) {
      const updated = await updateList(listModal.id, payload)
      setLists(current => current.map(entry => String(entry.id) === String(updated.id) ? { ...entry, ...updated } : entry))
      if (selectedList && String(selectedList.id) === String(updated.id)) setSelectedList(current => ({ ...current, ...updated }))
    } else {
      const created = await createList(payload)
      setLists(current => [created, ...current])
    }
    setListModal(null)
    await loadLists()
  }

  async function removeList(list) {
    if (!window.confirm(tr(`Видалити список «${list.title}» разом з усіма бажаннями?`, `Delete the list “${list.title}” with all its wishes?`))) return
    try {
      await deleteList(list.id)
      setLists(current => current.filter(entry => String(entry.id) !== String(list.id)))
      if (selectedList && String(selectedList.id) === String(list.id)) {
        setSelectedList(null)
        setItems([])
      }
    } catch (requestError) {
      setError(requestError?.message || tr('Не вдалося видалити список.', 'Could not delete the list.'))
    }
  }

  async function saveItem(payload) {
    if (!selectedList) return
    if (itemModal?.id) {
      const updated = await updateItem(itemModal.id, payload)
      setItems(current => current.map(entry => String(entry.id) === String(updated.id) ? updated : entry))
      if (viewItem && String(viewItem.id) === String(updated.id)) setViewItem(updated)
    } else {
      const created = await createItem(selectedList.id, payload)
      setItems(current => [created, ...current])
    }
    setItemModal(null)
    await loadLists()
  }

  async function removeItem(item) {
    if (!window.confirm(tr(`Видалити бажання «${item.title}»?`, `Delete the wish “${item.title}”?`))) return
    try {
      await deleteItem(item.id)
      setItems(current => current.filter(entry => String(entry.id) !== String(item.id)))
      if (viewItem && String(viewItem.id) === String(item.id)) setViewItem(null)
      await loadLists()
    } catch (requestError) {
      setError(requestError?.message || tr('Не вдалося видалити бажання.', 'Could not delete the wish.'))
    }
  }

  const filteredLists = useMemo(() => lists.filter(list => {
    const matchesSearch = list.title.toLowerCase().includes(search.trim().toLowerCase())
    const matchesFilter = filter === 'all' || listVisibility(list) === filter
    return matchesSearch && matchesFilter
  }), [filter, lists, search])

  if (selectedList) {
    return (
      <div className="anim-fade-up">
        <div className="wrap">
          {error && <div className={s.pageError}>{error}<button type="button" onClick={() => loadItems(selectedList)}>{tr('Повторити', 'Retry')}</button></div>}
          <WishlistDetail
            list={selectedList}
            items={items}
            loading={itemsLoading}
            onBack={() => { setSelectedList(null); setItems([]); setError('') }}
            onAdd={() => setItemModal({})}
            onEditList={() => setListModal(selectedList)}
            onOpenItem={item => setViewItem(item)}
            onEditItem={item => setItemModal(item)}
            onDeleteItem={removeItem}
          />
          <Footer />
        </div>
        {listModal && <ListModal list={listModal?.id ? listModal : null} onClose={() => setListModal(null)} onSave={saveList} />}
        {itemModal && <ItemModal item={itemModal?.id ? itemModal : null} onClose={() => setItemModal(null)} onSave={saveItem} />}
        {viewItem && <ItemDetailModal item={viewItem} onClose={() => setViewItem(null)} onEdit={() => { setItemModal(viewItem); setViewItem(null) }} onDelete={() => removeItem(viewItem)} />}
      </div>
    )
  }

  return (
    <div className="anim-fade-up">
      <div className="wrap">
        <section className={s.pageHero}>
          <div>
            <span>{tr('Твоя колекція бажань', 'Your wish collection')}</span>
            <h1>{tr('Мої списки', 'My lists')}</h1>
            <p>{tr('Збирай усе бажане в одному місці та відкривай потрібні списки друзям.', 'Keep everything you want in one place and share selected lists with friends.')}</p>
          </div>
          <button type="button" className="btn-primary" onClick={() => setListModal({})}>
            <AppIcon name="plus" size={18} /> {tr('Створити список', 'Create list')}
          </button>
        </section>

        <Stats lists={lists} />

        <section className={s.controls}>
          <div className={s.searchBox}>
            <AppIcon name="search" size={18} />
            <input value={search} placeholder={tr('Пошук серед моїх списків', 'Search my lists')} onChange={event => setSearch(event.target.value)} />
            {search && <button type="button" onClick={() => setSearch('')} aria-label={tr('Очистити', 'Clear')}><AppIcon name="close" size={15} /></button>}
          </div>
          <div className={s.filters}>
            {filters.map(option => (
              <button
                type="button"
                key={option.value}
                className={filter === option.value ? s.filterActive : ''}
                onClick={() => setFilter(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>

        {error && <div className={s.pageError}>{error}<button type="button" onClick={loadLists}>{tr('Повторити', 'Retry')}</button></div>}

        {loading ? (
          <div className={s.loadingState}><div className="auth-spinner" /><span>{tr('Завантажуємо списки…', 'Loading lists…')}</span></div>
        ) : filteredLists.length === 0 ? (
          <div className={s.emptyState}>
            <div className={s.emptyIcon}><AppIcon name="lists" size={36} /></div>
            <h2>{lists.length === 0 ? tr('Створи свій перший список', 'Create your first list') : tr('Нічого не знайдено', 'Nothing found')}</h2>
            <p>{lists.length === 0 ? tr('Наприклад: «На день народження», «Техніка» або «Мрії на майбутнє».', 'For example: “Birthday”, “Tech” or “Future dreams”.') : tr('Зміни пошуковий запит або обери інший фільтр.', 'Change the search query or choose another filter.')}</p>
            {lists.length === 0 && <button type="button" className="btn-primary" onClick={() => setListModal({})}><AppIcon name="plus" size={17} /> {tr('Створити список', 'Create list')}</button>}
          </div>
        ) : (
          <div className={s.listsGrid}>
            {filteredLists.map(list => (
              <ListCard
                key={list.id}
                list={list}
                onOpen={() => openList(list)}
                onEdit={() => setListModal(list)}
                onDelete={() => removeList(list)}
              />
            ))}
            <button type="button" className={s.addCard} onClick={() => setListModal({})}>
              <span><AppIcon name="plus" size={25} /></span>
              <strong>{tr('Новий список', 'New list')}</strong>
              <small>{tr('Збери нову добірку бажань', 'Create a new wish collection')}</small>
            </button>
          </div>
        )}

        <Footer />
      </div>

      {listModal && <ListModal list={listModal?.id ? listModal : null} onClose={() => setListModal(null)} onSave={saveList} />}
    </div>
  )
}
