import { useState, useEffect } from 'react'
import Footer from '../components/Footer'
import AppIcon from '../components/AppIcons'
import { getCatalog, getCatalogCategories, getMyLists, addCatalogItemToList } from '../api/client'
import { useLanguage } from '../i18n/LanguageContext'
import s from './Catalog.module.css'

// Базові категорії з іконками. Якщо в каталозі є інші — додаються динамічно.
const CATEGORY_ICONS = {
  'Техніка': '💻', 'Гаджети': '📱', 'Одяг': '👟', 'Дім': '🏠',
  'Ігри': '🎮', 'Книги': '📚', 'Краса': '💄', 'Спорт': '⚽',
}

function ListPickerCover({ value }) {
  const cover = String(value || '').trim()
  return /^(https?:\/\/|\/backend\/|data:image\/|blob:)/i.test(cover)
    ? <img src={cover} alt="" />
    : <span>{cover || '🎁'}</span>
}

export default function Catalog({ onNav }) {
  const { tr, locale } = useLanguage()

  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [myLists, setMyLists] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCat, setActiveCat] = useState('all')
  const [adding, setAdding] = useState(null)
  const [addedTo, setAddedTo] = useState({})
  const [addedLists, setAddedLists] = useState({})
  const [pickFor, setPickFor] = useState(null)
  const [detail, setDetail] = useState(null)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const [prod, cats, lists] = await Promise.all([
        getCatalog(),
        getCatalogCategories().catch(() => []),
        getMyLists().catch(() => []),
      ])
      setProducts(Array.isArray(prod) ? prod : [])
      setCategories(Array.isArray(cats) ? cats : [])
      setMyLists(Array.isArray(lists) ? lists : [])
    } catch {
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd(product, listId) {
    const list = myLists.find(l => l.id === listId)
    setAdding(product.id)
    setMessage({ type: '', text: '' })
    try {
      await addCatalogItemToList(product.id, listId)
      // Запам'ятовуємо в які списки товар уже додано (щоб прибрати їх із пікера)
      setAddedLists(prev => ({
        ...prev,
        [product.id]: [...(prev[product.id] || []), listId],
      }))
      setAddedTo(prev => ({ ...prev, [product.id]: list?.title || tr('Список', 'List') }))
      setPickFor(null)
      setDetail(null)
      setMessage({ type: 'success', text: tr(`Додано до «${list?.title}»`, `Added to "${list?.title}"`) })
      setTimeout(() => setAddedTo(prev => { const n = { ...prev }; delete n[product.id]; return n }), 3000)
    } catch (e) {
      setMessage({ type: 'error', text: e?.message || tr('Не вдалося додати.', 'Could not add.') })
    } finally {
      setAdding(null)
    }
  }

  // Списки, куди товар ще НЕ додано
  function availableLists(product) {
    const used = addedLists[product?.id] || []
    return myLists.filter(l => !used.includes(l.id))
  }

  // Клік «В список»: якщо немає списків — на сторінку списків,
  // якщо один — одразу додаємо, якщо декілька — пікер.
  function startAdd(product) {
    const lists = availableLists(product)
    if (myLists.length === 0) { onNav('lists'); return }
    if (lists.length === 0) {
      setMessage({ type: 'success', text: tr('Товар уже у всіх ваших списках.', 'Item is already in all your lists.') })
      return
    }
    if (lists.length === 1) { handleAdd(product, lists[0].id); return }
    setPickFor(product)
  }

  const allCategories = [
    { value: 'all', label: tr('Всі', 'All'), icon: '✨' },
    ...categories.map(c => ({ value: c.value, label: c.value, icon: CATEGORY_ICONS[c.value] || '🏷️', count: c.count })),
  ]

  const filtered = products.filter(p => {
    const matchSearch = !search || p.title?.toLowerCase().includes(search.toLowerCase())
    const matchCat = activeCat === 'all' || p.category === activeCat
    return matchSearch && matchCat
  })

  const fmtPrice = p => p.price != null
    ? `${Number(p.price).toLocaleString(locale)} ${p.currency === 'USD' ? '$' : p.currency === 'EUR' ? '€' : '₴'}`
    : null

  return (
    <div className="anim-fade-up">
      <div className="wrap">
        <section className={s.pageHero}>
          <div>
            <span>{tr('ІДЕЇ ДЛЯ ПОДАРУНКІВ', 'GIFT IDEAS')}</span>
            <h1>{tr('Каталог', 'Catalog')}</h1>
            <p>{tr('Підбірка ідей. Обери товар і додай його до власного списку побажань.', 'A selection of ideas. Pick an item and add it to your own wishlist.')}</p>
          </div>
          <div className={s.heroBadge}>
            <span>🛍️</span>
            <div><strong>{products.length}</strong><small>{tr('товарів', 'items')}</small></div>
          </div>
        </section>

        {message.text && (
          <div className={`${s.notice} ${message.type === 'error' ? s.noticeError : s.noticeSuccess}`}>
            <span>{message.text}</span>
            <button onClick={() => setMessage({ type: '', text: '' })}>×</button>
          </div>
        )}

        <div className={s.layout}>
          <aside className={s.sidebar}>
            <div className={s.sidebarTitle}>{tr('Категорії', 'Categories')}</div>
            {allCategories.map(c => (
              <button key={c.value} className={activeCat === c.value ? s.catActive : ''} onClick={() => setActiveCat(c.value)}>
                <span className={s.catIcon}>{c.icon}</span>
                <span className={s.catLabel}>{c.label}</span>
                {c.count != null && <b>{c.count}</b>}
              </button>
            ))}
          </aside>

          <div>
            <div className={s.searchBox}>
              <AppIcon name="search" size={18} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder={tr('Пошук у каталозі...', 'Search catalog...')} />
              {search && <button onClick={() => setSearch('')}><AppIcon name="close" size={15} /></button>}
            </div>

            {loading ? (
              <div className={s.loading}><div className="auth-spinner" />{tr('Завантажуємо каталог…', 'Loading catalog…')}</div>
            ) : filtered.length === 0 ? (
              <div className={s.empty}>
                <div>🔍</div>
                <h2>{products.length === 0 ? tr('Каталог порожній', 'Catalog is empty') : tr('Нічого не знайдено', 'Nothing found')}</h2>
                <p>{products.length === 0 ? tr('Товари додає адміністратор через панель керування.', 'Items are added by the administrator.') : tr('Спробуй іншу категорію або запит.', 'Try another category or query.')}</p>
              </div>
            ) : (
              <div className={s.grid}>
                {filtered.map(p => {
                  const added = addedTo[p.id]
                  return (
                    <article key={p.id} className={`${s.card} ${added ? s.cardAdded : ''}`} onClick={() => setDetail(p)}>
                      <div className={s.cardImage}>
                        {p.image_url ? <img src={p.image_url} alt={p.title} /> : <span>🎁</span>}
                        {p.is_featured && <div className={s.featuredBadge}>★ {tr('Топ', 'Top')}</div>}
                      </div>
                      <div className={s.cardBody}>
                        {p.category && <div className={s.cardCat}>{CATEGORY_ICONS[p.category] || '🏷️'} {p.category}</div>}
                        <h3>{p.title}</h3>
                        {fmtPrice(p) && <div className={s.cardPrice}>{fmtPrice(p)}</div>}
                      </div>
                      <div className={s.cardActions} onClick={e => e.stopPropagation()}>
                        {added ? (
                          <div className={s.addedState}><AppIcon name="check" size={14} /> {tr('Додано', 'Added')}</div>
                        ) : (
                          <button className={s.addBtn} onClick={() => startAdd(p)} disabled={adding === p.id}>
                            <AppIcon name="plus" size={14} />
                            {adding === p.id ? tr('Додаємо…', 'Adding…') : tr('У список', 'To list')}
                          </button>
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <Footer />
      </div>

      {/* Деталі товару */}
      {detail && (
        <div className={s.backdrop} onMouseDown={() => setDetail(null)}>
          <div className={s.detailModal} onMouseDown={e => e.stopPropagation()}>
            <button className={s.detailClose} onClick={() => setDetail(null)}><AppIcon name="close" size={18} /></button>
            <div className={s.detailImage}>
              {detail.image_url ? <img src={detail.image_url} alt={detail.title} /> : <span>🎁</span>}
            </div>
            <div className={s.detailBody}>
              {detail.category && <div className={s.cardCat}>{CATEGORY_ICONS[detail.category] || '🏷️'} {detail.category}</div>}
              <h2>{detail.title}</h2>
              {fmtPrice(detail) && <div className={s.detailPrice}>{fmtPrice(detail)}</div>}
              {detail.description && <p className={s.detailDesc}>{detail.description}</p>}
              <div className={s.detailActions}>
                {detail.product_url && (
                  <a className="btn-outline" href={detail.product_url} target="_blank" rel="noreferrer">
                    <AppIcon name="link" size={15} /> {tr('Купити', 'Buy')}
                  </a>
                )}
                {addedTo[detail.id] ? (
                  <button className="btn-primary" disabled><AppIcon name="check" size={15} /> {tr('Додано', 'Added')}</button>
                ) : (
                  <button className="btn-primary" onClick={() => startAdd(detail)} disabled={adding === detail.id}>
                    <AppIcon name="plus" size={15} /> {adding === detail.id ? tr('Додаємо…', 'Adding…') : tr('Додати в список', 'Add to list')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Пікер списку */}
      {pickFor && (
        <div className={s.backdrop} onMouseDown={() => setPickFor(null)}>
          <div className={s.pickerModal} onMouseDown={e => e.stopPropagation()}>
            <div className={s.pickerTitle}>{tr('У який список додати?', 'Which list to add to?')}</div>
            {availableLists(pickFor).map(l => (
              <button key={l.id} className={s.pickerItem} onClick={() => handleAdd(pickFor, l.id)} disabled={adding === pickFor.id}>
                <ListPickerCover value={l.emoji} /> {l.title}
              </button>
            ))}
            <button className="btn-outline" style={{ width: '100%', marginTop: 8 }} onClick={() => setPickFor(null)}>{tr('Скасувати', 'Cancel')}</button>
          </div>
        </div>
      )}
    </div>
  )
}
