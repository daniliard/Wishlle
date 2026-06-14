import { useEffect, useMemo, useState } from 'react'
import AppIcon from '../components/AppIcons'
import Footer from '../components/Footer'
import {
  createItem,
  createList,
  deleteItem,
  deleteList,
  getListItems,
  getMyLists,
  parseUrl,
  updateItem,
  updateList,
} from '../api/client'
import { useLanguage } from '../i18n/LanguageContext'
import s from './Lists.module.css'

const EMOJIS = ['🎁', '🎂', '🎮', '💻', '✈️', '🏠', '👟', '📚', '🎧', '✨']
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

function ModalShell({ title, subtitle, onClose, children }) {
  const { tr, locale } = useLanguage()
  return (
    <div className={s.modalBackdrop} onMouseDown={event => event.target === event.currentTarget && onClose()}>
      <div className={s.modal} role="dialog" aria-modal="true" aria-label={title}>
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
    </div>
  )
}

function ListModal({ list, onClose, onSave }) {
  const { tr, locale } = useLanguage()
  const [form, setForm] = useState({
    title: list?.title || '',
    emoji: list?.emoji || '🎁',
    is_public: list?.is_public ?? true,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    if (!form.title.trim()) {
      setError(tr('Вкажи назву списку.', 'Enter a list name.'))
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSave({ ...form, title: form.title.trim() })
    } catch (requestError) {
      setError(requestError?.message || tr('Не вдалося зберегти список.', 'Could not save the list.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalShell
      title={list ? tr('Редагувати список', 'Edit list') : tr('Створити новий список', 'Create a new list')}
      subtitle={tr('Дай списку зрозумілу назву та обери, хто зможе його бачити.', 'Give the list a clear name and choose who can see it.')}
      onClose={onClose}
    >
      <form onSubmit={submit} className={s.modalForm}>
        <label className={s.field}>
          <span>{tr('Назва списку', 'List name')}</span>
          <input
            autoFocus
            value={form.title}
            maxLength={120}
            placeholder={tr('Наприклад, Подарунки на день народження', 'For example, Birthday gifts')}
            onChange={event => setForm(current => ({ ...current, title: event.target.value }))}
          />
        </label>

        <div className={s.field}>
          <span>{tr('Обкладинка', 'Cover')}</span>
          <div className={s.emojiPicker}>
            {EMOJIS.map(emoji => (
              <button
                type="button"
                key={emoji}
                className={form.emoji === emoji ? s.emojiActive : ''}
                onClick={() => setForm(current => ({ ...current, emoji }))}
                aria-label={`${tr('Обрати', 'Choose')} ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <div className={s.field}>
          <span>{tr('Видимість', 'Visibility')}</span>
          <div className={s.visibilityOptions}>
            <button
              type="button"
              className={form.is_public ? s.visibilityActive : ''}
              onClick={() => setForm(current => ({ ...current, is_public: true }))}
            >
              <span>🌍</span>
              <div><strong>{tr('Публічний', 'Public')}</strong><small>{tr('Друзі зможуть переглядати список', 'Friends will be able to view the list')}</small></div>
            </button>
            <button
              type="button"
              className={!form.is_public ? s.visibilityActive : ''}
              onClick={() => setForm(current => ({ ...current, is_public: false }))}
            >
              <span>🔒</span>
              <div><strong>{tr('Приватний', 'Private')}</strong><small>{tr('Список бачиш лише ти', 'Only you can see this list')}</small></div>
            </button>
          </div>
        </div>

        {error && <div className={s.errorBox}>{error}</div>}

        <div className={s.modalActions}>
          <button type="button" className="btn-outline" onClick={onClose}>{tr('Скасувати', 'Cancel')}</button>
          <button type="submit" className="btn-primary" disabled={saving}>
            <AppIcon name={saving ? 'sparkles' : 'check'} size={17} />
            {saving ? tr('Зберігаємо…', 'Saving…') : list ? tr('Зберегти зміни', 'Save changes') : tr('Створити список', 'Create list')}
          </button>
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

function Stats({ lists }) {
  const { tr, locale } = useLanguage()
  const totalItems = lists.reduce((sum, list) => sum + Number(list.items_count || 0), 0)
  const publicCount = lists.filter(list => list.is_public).length
  const privateCount = lists.length - publicCount
  const cards = [
    { icon: 'lists', value: lists.length, label: tr('списків', 'lists') },
    { icon: 'gift', value: totalItems, label: tr('бажань', 'wishes') },
    { icon: 'friends', value: publicCount, label: tr('публічних', 'public') },
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
        <span className={s.listEmoji}>{list.emoji || '🎁'}</span>
        <span className={`${s.visibilityBadge} ${list.is_public ? s.publicBadge : s.privateBadge}`}>
          {list.is_public ? `🌍 ${tr('Публічний', 'Public')}` : `🔒 ${tr('Приватний', 'Private')}`}
        </span>
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

function WishlistDetail({ list, items, loading, onBack, onAdd, onEditList, onEditItem, onDeleteItem }) {
  const { tr, locale } = useLanguage()
  return (
    <div className={s.detailPage}>
      <div className={s.detailHeader}>
        <button type="button" className={s.backButton} onClick={onBack}>
          <AppIcon name="arrowLeft" size={18} /> {tr('Назад до списків', 'Back to lists')}
        </button>
        <div className={s.detailActions}>
          <button type="button" className="btn-outline" onClick={onEditList}><AppIcon name="edit" size={16} /> {tr('Редагувати', 'Edit')}</button>
          <button type="button" className="btn-primary" onClick={onAdd}><AppIcon name="plus" size={17} /> {tr('Додати бажання', 'Add wish')}</button>
        </div>
      </div>

      <section className={s.detailHero}>
        <div className={s.detailEmoji}>{list.emoji || '🎁'}</div>
        <div className={s.detailCopy}>
          <span className={list.is_public ? s.detailPublic : s.detailPrivate}>{list.is_public ? `🌍 ${tr('Публічний список', 'Public list')}` : `🔒 ${tr('Приватний список', 'Private list')}`}</span>
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
            <article className={s.itemCard} key={item.id}>
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
                    <button type="button" onClick={() => onEditItem(item)} aria-label={tr('Редагувати', 'Edit')}><AppIcon name="edit" size={16} /></button>
                    <button type="button" className={s.dangerButton} onClick={() => onDeleteItem(item)} aria-label={tr('Видалити', 'Delete')}><AppIcon name="trash" size={16} /></button>
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
      await loadLists()
    } catch (requestError) {
      setError(requestError?.message || tr('Не вдалося видалити бажання.', 'Could not delete the wish.'))
    }
  }

  const filteredLists = useMemo(() => lists.filter(list => {
    const matchesSearch = list.title.toLowerCase().includes(search.trim().toLowerCase())
    const matchesFilter = filter === 'all' || (filter === 'public' ? list.is_public : !list.is_public)
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
            onEditItem={item => setItemModal(item)}
            onDeleteItem={removeItem}
          />
          <Footer />
        </div>
        {listModal && <ListModal list={listModal?.id ? listModal : null} onClose={() => setListModal(null)} onSave={saveList} />}
        {itemModal && <ItemModal item={itemModal?.id ? itemModal : null} onClose={() => setItemModal(null)} onSave={saveItem} />}
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
