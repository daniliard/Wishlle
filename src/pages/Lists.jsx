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
import s from './Lists.module.css'

const EMOJIS = ['🎁', '🎂', '🎮', '💻', '✈️', '🏠', '👟', '📚', '🎧', '✨']
const FILTERS = [
  { value: 'all', label: 'Усі списки' },
  { value: 'public', label: 'Публічні' },
  { value: 'private', label: 'Приватні' },
]

function formatDate(value) {
  if (!value) return 'Щойно створено'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Нещодавно оновлено'
  return new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' }).format(date)
}

function formatPrice(value) {
  if (value === null || value === undefined || value === '') return ''
  const amount = Number(value)
  if (Number.isNaN(amount)) return ''
  return `${amount.toLocaleString('uk-UA')} ₴`
}

function ModalShell({ title, subtitle, onClose, children }) {
  return (
    <div className={s.modalBackdrop} onMouseDown={event => event.target === event.currentTarget && onClose()}>
      <div className={s.modal} role="dialog" aria-modal="true" aria-label={title}>
        <div className={s.modalHeader}>
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button type="button" className={s.iconButton} onClick={onClose} aria-label="Закрити">
            <AppIcon name="close" size={19} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function ListModal({ list, onClose, onSave }) {
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
      setError('Вкажи назву списку.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSave({ ...form, title: form.title.trim() })
    } catch (requestError) {
      setError(requestError?.message || 'Не вдалося зберегти список.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalShell
      title={list ? 'Редагувати список' : 'Створити новий список'}
      subtitle="Дай списку зрозумілу назву та обери, хто зможе його бачити."
      onClose={onClose}
    >
      <form onSubmit={submit} className={s.modalForm}>
        <label className={s.field}>
          <span>Назва списку</span>
          <input
            autoFocus
            value={form.title}
            maxLength={120}
            placeholder="Наприклад, Подарунки на день народження"
            onChange={event => setForm(current => ({ ...current, title: event.target.value }))}
          />
        </label>

        <div className={s.field}>
          <span>Обкладинка</span>
          <div className={s.emojiPicker}>
            {EMOJIS.map(emoji => (
              <button
                type="button"
                key={emoji}
                className={form.emoji === emoji ? s.emojiActive : ''}
                onClick={() => setForm(current => ({ ...current, emoji }))}
                aria-label={`Обрати ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <div className={s.field}>
          <span>Видимість</span>
          <div className={s.visibilityOptions}>
            <button
              type="button"
              className={form.is_public ? s.visibilityActive : ''}
              onClick={() => setForm(current => ({ ...current, is_public: true }))}
            >
              <span>🌍</span>
              <div><strong>Публічний</strong><small>Друзі зможуть переглядати список</small></div>
            </button>
            <button
              type="button"
              className={!form.is_public ? s.visibilityActive : ''}
              onClick={() => setForm(current => ({ ...current, is_public: false }))}
            >
              <span>🔒</span>
              <div><strong>Приватний</strong><small>Список бачиш лише ти</small></div>
            </button>
          </div>
        </div>

        {error && <div className={s.errorBox}>{error}</div>}

        <div className={s.modalActions}>
          <button type="button" className="btn-outline" onClick={onClose}>Скасувати</button>
          <button type="submit" className="btn-primary" disabled={saving}>
            <AppIcon name={saving ? 'sparkles' : 'check'} size={17} />
            {saving ? 'Зберігаємо…' : list ? 'Зберегти зміни' : 'Створити список'}
          </button>
        </div>
      </form>
    </ModalShell>
  )
}

function ItemModal({ item, onClose, onSave }) {
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
      setError('Спочатку встав посилання на товар.')
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
      setError(requestError?.message || 'Не вдалося отримати дані за посиланням. Заповни поля вручну.')
    } finally {
      setParsing(false)
    }
  }

  async function submit(event) {
    event.preventDefault()
    if (!form.title.trim()) {
      setError('Вкажи назву бажання.')
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
      setError(requestError?.message || 'Не вдалося зберегти бажання.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalShell
      title={item ? 'Редагувати бажання' : 'Додати бажання'}
      subtitle="Встав посилання для автозаповнення або внеси інформацію вручну."
      onClose={onClose}
    >
      <form onSubmit={submit} className={s.modalForm}>
        <label className={s.field}>
          <span>Посилання на товар</span>
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
              <AppIcon name="sparkles" size={16} /> {parsing ? 'Чекай…' : 'Заповнити'}
            </button>
          </div>
        </label>

        <div className={s.itemFormGrid}>
          <div className={s.previewBox}>
            {form.image_url && !imageBroken
              ? <img src={form.image_url} alt="Прев’ю товару" onError={() => setImageBroken(true)} />
              : <div><AppIcon name="gift" size={34} /><span>Фото підтягнеться з посилання</span></div>}
          </div>
          <div className={s.itemFields}>
            <label className={s.field}>
              <span>Назва</span>
              <input
                value={form.title}
                maxLength={180}
                placeholder="Наприклад, Навушники Sony"
                onChange={event => setForm(current => ({ ...current, title: event.target.value }))}
              />
            </label>
            <label className={s.field}>
              <span>Орієнтовна ціна, ₴</span>
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
          <span>Коментар</span>
          <textarea
            rows="3"
            maxLength={1000}
            value={form.notes}
            placeholder="Колір, розмір, модель або інші деталі"
            onChange={event => setForm(current => ({ ...current, notes: event.target.value }))}
          />
        </label>

        {error && <div className={s.errorBox}>{error}</div>}

        <div className={s.modalActions}>
          <button type="button" className="btn-outline" onClick={onClose}>Скасувати</button>
          <button type="submit" className="btn-primary" disabled={saving}>
            <AppIcon name={saving ? 'sparkles' : 'check'} size={17} />
            {saving ? 'Зберігаємо…' : item ? 'Зберегти зміни' : 'Додати бажання'}
          </button>
        </div>
      </form>
    </ModalShell>
  )
}

function Stats({ lists }) {
  const totalItems = lists.reduce((sum, list) => sum + Number(list.items_count || 0), 0)
  const publicCount = lists.filter(list => list.is_public).length
  const privateCount = lists.length - publicCount
  const cards = [
    { icon: 'lists', value: lists.length, label: 'списків' },
    { icon: 'gift', value: totalItems, label: 'бажань' },
    { icon: 'friends', value: publicCount, label: 'публічних' },
    { icon: 'shield', value: privateCount, label: 'приватних' },
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
  const preview = Array.isArray(list.preview_items) ? list.preview_items.slice(0, 4) : []
  return (
    <article className={s.listCard} onClick={onOpen} tabIndex="0" onKeyDown={event => event.key === 'Enter' && onOpen()}>
      <div className={s.listCover}>
        <div className={s.coverGlow} />
        <span className={s.listEmoji}>{list.emoji || '🎁'}</span>
        <span className={`${s.visibilityBadge} ${list.is_public ? s.publicBadge : s.privateBadge}`}>
          {list.is_public ? '🌍 Публічний' : '🔒 Приватний'}
        </span>
      </div>
      <div className={s.listBody}>
        <div className={s.listTitleRow}>
          <div>
            <h3>{list.title}</h3>
            <p>{formatDate(list.date_created)}</p>
          </div>
          <div className={s.cardActions}>
            <button type="button" onClick={event => { event.stopPropagation(); onEdit() }} aria-label="Редагувати список">
              <AppIcon name="edit" size={16} />
            </button>
            <button type="button" className={s.dangerButton} onClick={event => { event.stopPropagation(); onDelete() }} aria-label="Видалити список">
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
            <div className={s.emptyPreview}><AppIcon name="gift" size={17} /> Додай перше бажання</div>
          )}
        </div>

        <div className={s.listBottom}>
          <div className={s.countGroup}>
            <strong>{list.items_count || 0}</strong><span>бажань</span>
            {Number(list.reserved_count || 0) > 0 && <em>{list.reserved_count} заброньовано</em>}
          </div>
          <span className={s.openHint}>Відкрити <AppIcon name="arrowRight" size={15} /></span>
        </div>
      </div>
    </article>
  )
}

function WishlistDetail({ list, items, loading, onBack, onAdd, onEditList, onEditItem, onDeleteItem }) {
  return (
    <div className={s.detailPage}>
      <div className={s.detailHeader}>
        <button type="button" className={s.backButton} onClick={onBack}>
          <AppIcon name="arrowLeft" size={18} /> Назад до списків
        </button>
        <div className={s.detailActions}>
          <button type="button" className="btn-outline" onClick={onEditList}><AppIcon name="edit" size={16} /> Редагувати</button>
          <button type="button" className="btn-primary" onClick={onAdd}><AppIcon name="plus" size={17} /> Додати бажання</button>
        </div>
      </div>

      <section className={s.detailHero}>
        <div className={s.detailEmoji}>{list.emoji || '🎁'}</div>
        <div className={s.detailCopy}>
          <span className={list.is_public ? s.detailPublic : s.detailPrivate}>{list.is_public ? '🌍 Публічний список' : '🔒 Приватний список'}</span>
          <h1>{list.title}</h1>
          <p>{items.length} {items.length === 1 ? 'бажання' : 'бажань'} · створено {formatDate(list.date_created).toLowerCase()}</p>
        </div>
      </section>

      {loading ? (
        <div className={s.loadingState}><div className="auth-spinner" /><span>Завантажуємо бажання…</span></div>
      ) : items.length === 0 ? (
        <div className={s.emptyState}>
          <div className={s.emptyIcon}><AppIcon name="gift" size={36} /></div>
          <h2>У цьому списку ще порожньо</h2>
          <p>Додай товар вручну або встав посилання — Wishlle спробує підтягнути назву, ціну та фото.</p>
          <button type="button" className="btn-primary" onClick={onAdd}><AppIcon name="plus" size={17} /> Додати перше бажання</button>
        </div>
      ) : (
        <div className={s.itemsGrid}>
          {items.map(item => (
            <article className={s.itemCard} key={item.id}>
              <div className={s.itemImage}>
                {item.image_url ? <img src={item.image_url} alt={item.title} /> : <AppIcon name="gift" size={36} />}
                <span className={`${s.itemStatus} ${item.status === 'reserved' ? s.statusReserved : s.statusAvailable}`}>
                  {item.status === 'reserved' ? 'Заброньовано' : item.status === 'purchased' ? 'Придбано' : 'Доступно'}
                </span>
              </div>
              <div className={s.itemBody}>
                <div className={s.itemTop}>
                  <h3>{item.title}</h3>
                  {item.price !== null && item.price !== undefined && <strong>{formatPrice(item.price)}</strong>}
                </div>
                {item.notes && <p>{item.notes}</p>}
                <div className={s.itemFooter}>
                  {item.url ? (
                    <a href={item.url} target="_blank" rel="noreferrer"><AppIcon name="link" size={15} /> Перейти до товару</a>
                  ) : <span className={s.noLink}>Без посилання</span>}
                  <div>
                    <button type="button" onClick={() => onEditItem(item)} aria-label="Редагувати"><AppIcon name="edit" size={16} /></button>
                    <button type="button" className={s.dangerButton} onClick={() => onDeleteItem(item)} aria-label="Видалити"><AppIcon name="trash" size={16} /></button>
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
      setError(requestError?.message || 'Не вдалося завантажити списки.')
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
      setError(requestError?.message || 'Не вдалося завантажити бажання.')
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
    if (!window.confirm(`Видалити список «${list.title}» разом з усіма бажаннями?`)) return
    try {
      await deleteList(list.id)
      setLists(current => current.filter(entry => String(entry.id) !== String(list.id)))
      if (selectedList && String(selectedList.id) === String(list.id)) {
        setSelectedList(null)
        setItems([])
      }
    } catch (requestError) {
      setError(requestError?.message || 'Не вдалося видалити список.')
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
    if (!window.confirm(`Видалити бажання «${item.title}»?`)) return
    try {
      await deleteItem(item.id)
      setItems(current => current.filter(entry => String(entry.id) !== String(item.id)))
      await loadLists()
    } catch (requestError) {
      setError(requestError?.message || 'Не вдалося видалити бажання.')
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
          {error && <div className={s.pageError}>{error}<button type="button" onClick={() => loadItems(selectedList)}>Повторити</button></div>}
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
            <span>Твоя колекція бажань</span>
            <h1>Мої списки</h1>
            <p>Збирай усе бажане в одному місці та відкривай потрібні списки друзям.</p>
          </div>
          <button type="button" className="btn-primary" onClick={() => setListModal({})}>
            <AppIcon name="plus" size={18} /> Створити список
          </button>
        </section>

        <Stats lists={lists} />

        <section className={s.controls}>
          <div className={s.searchBox}>
            <AppIcon name="search" size={18} />
            <input value={search} placeholder="Пошук серед моїх списків" onChange={event => setSearch(event.target.value)} />
            {search && <button type="button" onClick={() => setSearch('')} aria-label="Очистити"><AppIcon name="close" size={15} /></button>}
          </div>
          <div className={s.filters}>
            {FILTERS.map(option => (
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

        {error && <div className={s.pageError}>{error}<button type="button" onClick={loadLists}>Повторити</button></div>}

        {loading ? (
          <div className={s.loadingState}><div className="auth-spinner" /><span>Завантажуємо списки…</span></div>
        ) : filteredLists.length === 0 ? (
          <div className={s.emptyState}>
            <div className={s.emptyIcon}><AppIcon name="lists" size={36} /></div>
            <h2>{lists.length === 0 ? 'Створи свій перший список' : 'Нічого не знайдено'}</h2>
            <p>{lists.length === 0 ? 'Наприклад: «На день народження», «Техніка» або «Мрії на майбутнє».' : 'Зміни пошуковий запит або обери інший фільтр.'}</p>
            {lists.length === 0 && <button type="button" className="btn-primary" onClick={() => setListModal({})}><AppIcon name="plus" size={17} /> Створити список</button>}
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
              <strong>Новий список</strong>
              <small>Збери нову добірку бажань</small>
            </button>
          </div>
        )}

        <Footer />
      </div>

      {listModal && <ListModal list={listModal?.id ? listModal : null} onClose={() => setListModal(null)} onSave={saveList} />}
    </div>
  )
}
