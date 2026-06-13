import { useState, useEffect, useRef } from 'react'
import Footer from '../components/Footer'
import s from './Lists.module.css'
import {
  getMyLists, createList, updateList, deleteList,
  getListItems, createItem, updateItem, deleteItem,
  reserveItem, parseUrl, getUserId,
} from '../api/client'

// ── Модалка створення/редагування списку ──────────────────────────────────
function ListModal({ list, onClose, onSave }) {
  const [form, setForm] = useState({
    title: list?.title || '',
    emoji: list?.emoji || '🎁',
    is_public: list?.is_public ?? true,
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit() {
    if (!form.title.trim()) return
    setSaving(true)
    try { await onSave(form) } finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#0f1e2e', border: '1px solid var(--border2)', borderRadius: 22, padding: 28, width: '100%', maxWidth: 400 }}>
        <div style={{ fontWeight: 900, fontSize: '1.1rem', marginBottom: 22 }}>{list ? 'Редагувати список' : 'Новий список'}</div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--muted)', marginBottom: 6 }}>Назва</div>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Наприклад: Хочу на ДН 🎂"
            style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 12, padding: '11px 14px', color: 'var(--text)', fontFamily: 'Nunito, sans-serif', fontSize: '0.9rem', outline: 'none' }} />
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--muted)', marginBottom: 6 }}>Видимість</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[{ v: true, l: '🔓 Публічний' }, { v: false, l: '🔒 Приватний' }].map(({ v, l }) => (
              <div key={String(v)} onClick={() => setForm(f => ({ ...f, is_public: v }))}
                style={{ flex: 1, padding: '9px 14px', borderRadius: 11, border: `1px solid ${form.is_public === v ? 'rgba(0,200,232,0.4)' : 'var(--border)'}`, background: form.is_public === v ? 'var(--cyan-glow)' : 'var(--surface)', color: form.is_public === v ? 'var(--cyan)' : 'var(--muted)', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', textAlign: 'center' }}>
                {l}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-outline" style={{ flex: 1 }} onClick={onClose}>Скасувати</button>
          <button className="btn-primary" style={{ flex: 1 }} onClick={handleSubmit} disabled={saving}>
            {saving ? '...' : 'Зберегти'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Модалка додавання бажання ──────────────────────────────────────────────
function ItemModal({ listId, item, onClose, onSave }) {
  const [form, setForm] = useState({
    title: item?.title || '',
    url: item?.url || '',
    price: item?.price || '',
    image_url: item?.image_url || '',
    notes: item?.notes || '',
  })
  const [parsing, setParsing] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleParse() {
    if (!form.url.trim()) return
    setParsing(true)
    try {
      const data = await parseUrl(form.url)
      setForm(f => ({
        ...f,
        title: data.title || f.title,
        price: data.price || f.price,
        image_url: data.image || f.image_url,
      }))
    } catch { /* ігнор */ }
    finally { setParsing(false) }
  }

  async function handleSubmit() {
    if (!form.title.trim()) return
    setSaving(true)
    try {
      await onSave({ ...form, wishlist_id: listId, status: 'available', price: form.price ? parseFloat(form.price) : null })
    } finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#0f1e2e', border: '1px solid var(--border2)', borderRadius: 22, padding: 28, width: '100%', maxWidth: 420 }}>
        <div style={{ fontWeight: 900, fontSize: '1.1rem', marginBottom: 22 }}>{item ? 'Редагувати' : 'Додати бажання'}</div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--muted)', marginBottom: 6 }}>Посилання (необов'язково)</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
              placeholder="https://rozetka.com.ua/..."
              style={{ flex: 1, background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 12, padding: '10px 14px', color: 'var(--text)', fontFamily: 'Nunito, sans-serif', fontSize: '0.85rem', outline: 'none' }} />
            <button className="btn-sm cyan" onClick={handleParse} disabled={parsing} style={{ whiteSpace: 'nowrap', padding: '0 14px' }}>
              {parsing ? '...' : '⚡ Авто'}
            </button>
          </div>
        </div>

        {[
          ['Назва *', 'title', 'text', 'AirPods Pro 2'],
          ['Ціна (₴)', 'price', 'number', '7500'],
        ].map(([label, key, type, placeholder]) => (
          <div key={key} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--muted)', marginBottom: 6 }}>{label}</div>
            <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              placeholder={placeholder}
              style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 12, padding: '10px 14px', color: 'var(--text)', fontFamily: 'Nunito, sans-serif', fontSize: '0.85rem', outline: 'none' }} />
          </div>
        ))}

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--muted)', marginBottom: 6 }}>Нотатка</div>
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Додаткова інформація..."
            rows={2}
            style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 12, padding: '10px 14px', color: 'var(--text)', fontFamily: 'Nunito, sans-serif', fontSize: '0.85rem', outline: 'none', resize: 'none' }} />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-outline" style={{ flex: 1 }} onClick={onClose}>Скасувати</button>
          <button className="btn-primary" style={{ flex: 1 }} onClick={handleSubmit} disabled={saving || !form.title.trim()}>
            {saving ? '...' : 'Зберегти'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Головна сторінка списків ───────────────────────────────────────────────
const GRAD_COLORS = ['lc1', 'lc2', 'lc3', 'lc4', 'lc5']

export default function Lists({ onNav }) {
  const [lists, setLists]             = useState([])
  const [items, setItems]             = useState([])
  const [loading, setLoading]         = useState(true)
  const [selectedList, setSelectedList] = useState(null)
  const [showListModal, setShowListModal] = useState(false)
  const [editingList, setEditingList]   = useState(null)
  const [showItemModal, setShowItemModal] = useState(false)
  const [editingItem, setEditingItem]   = useState(null)
  const [filter, setFilter]           = useState(0)

  const FILTERS = ['Всі', 'Публічні', 'Приватні']

  useEffect(() => {
    loadLists()
  }, [])

  useEffect(() => {
    if (selectedList) loadItems(selectedList.id)
  }, [selectedList])

  async function loadLists() {
    setLoading(true)
    try {
      const data = await getMyLists()
      setLists(Array.isArray(data) ? data : [])
    } catch { setLists([]) }
    finally { setLoading(false) }
  }

  async function loadItems(listId) {
    try {
      const data = await getListItems(listId)
      setItems(Array.isArray(data) ? data : [])
    } catch { setItems([]) }
  }

  async function handleSaveList(form) {
    if (editingList) {
      await updateList(editingList.id, form)
    } else {
      await createList(form)
    }
    setShowListModal(false)
    setEditingList(null)
    loadLists()
  }

  async function handleDeleteList(id, e) {
    e.stopPropagation()
    if (!confirm('Видалити список?')) return
    await deleteList(id)
    if (selectedList?.id === id) setSelectedList(null)
    loadLists()
  }

  async function handleSaveItem(form) {
    if (editingItem) {
      await updateItem(editingItem.id, form)
    } else {
      await createItem(form)
    }
    setShowItemModal(false)
    setEditingItem(null)
    if (selectedList) loadItems(selectedList.id)
  }

  async function handleDeleteItem(id) {
    if (!confirm('Видалити бажання?')) return
    await deleteItem(id)
    loadItems(selectedList.id)
  }

  async function handleReserve(item) {
    if (item.status === 'reserved') return
    try {
      await reserveItem(item.id)
      loadItems(selectedList.id)
    } catch (e) { alert(e.message) }
  }

  const filteredLists = lists.filter(l => {
    if (filter === 1) return l.is_public
    if (filter === 2) return !l.is_public
    return true
  })

  const totalItems = lists.reduce((acc, l) => acc + (l.items_count || 0), 0)

  return (
    <div className="anim-fade-up">
      <div className="wrap">
        <div className="content-toolbar">
          <div>
            <strong>{lists.length} {lists.length === 1 ? 'список' : 'списків'}</strong>
            <span>{totalItems} бажань у твоїй колекції</span>
          </div>
          <button className="btn-primary" onClick={() => { setEditingList(null); setShowListModal(true) }}>＋ Новий список</button>
        </div>

        {selectedList ? (
          // ── Вид конкретного списку ──────────────────────────────────────
          <div style={{ paddingTop: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <button className="btn-sm" onClick={() => { setSelectedList(null); setItems([]) }}>← Назад</button>
              <div style={{ flex: 1, fontWeight: 900, fontSize: '1.1rem' }}>{selectedList.title}</div>
              <button className="btn-sm cyan" onClick={() => { setShowItemModal(true); setEditingItem(null) }}>＋ Додати</button>
              <button className="btn-sm" onClick={() => { setEditingList(selectedList); setShowListModal(true) }}>✏️</button>
            </div>

            {items.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
                <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎁</div>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Список порожній</div>
                <div style={{ fontSize: '0.85rem', marginBottom: 20 }}>Додай перше бажання</div>
                <button className="btn-primary" onClick={() => setShowItemModal(true)}>＋ Додати бажання</button>
              </div>
            ) : (
              <div className={s.wishList}>
                {items.map(item => (
                  <div key={item.id} className={s.wishRow}>
                    <div className={s.wrImg}>
                      {item.image_url
                        ? <img src={item.image_url} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} />
                        : '🎁'}
                    </div>
                    <div className={s.wrInfo}>
                      <div className={s.wrName}>{item.title}</div>
                      {item.notes && <div className={s.wrMeta}>{item.notes}</div>}
                    </div>
                    <span className={`tag ${item.status === 'reserved' ? 'orange' : 'green'}`}>
                      {item.status === 'reserved' ? 'Зарезервовано' : 'Вільний'}
                    </span>
                    {item.price && <div className={s.wrPrice}>{Number(item.price).toLocaleString('uk-UA')} ₴</div>}
                    <div className={s.wrActions}>
                      {item.url && <a className="icon-btn" href={item.url} target="_blank" rel="noreferrer">🔗</a>}
                      <div className="icon-btn" onClick={() => { setEditingItem(item); setShowItemModal(true) }}>✏️</div>
                      <div className="icon-btn" onClick={() => handleDeleteItem(item.id)}>🗑️</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          // ── Сітка списків ────────────────────────────────────────────────
          <div style={{ paddingTop: 28 }}>
            <div className="pills">
              {FILTERS.map((f, i) => (
                <div key={f} className={`pill ${filter === i ? 'active' : ''}`} onClick={() => setFilter(i)}>{f}</div>
              ))}
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>Завантаження...</div>
            ) : (
              <div className={s.listsGrid}>
                {filteredLists.map((l, idx) => (
                  <div key={l.id} className={s.listCard} onClick={() => setSelectedList(l)}>
                    <div className={`${s.listCover} ${s[GRAD_COLORS[idx % GRAD_COLORS.length]]}`}>
                      <span style={{ fontSize: '2.4rem' }}>{l.emoji || '🎁'}</span>
                      <div className={s.lcBadge}>{l.is_public ? '🔓 Публічний' : '🔒 Приватний'}</div>
                    </div>
                    <div className={s.listBody}>
                      <div className={s.listName}>{l.title}</div>
                      <div className={s.listMeta}>
                        {l.date_created ? new Date(l.date_created).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' }) : ''}
                      </div>
                      <div className={s.listFooter}>
                        <span className="tag cyan">{l.items_count || 0} бажань</span>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <div className="icon-btn" onClick={e => { e.stopPropagation(); setEditingList(l); setShowListModal(true) }}>✏️</div>
                          <div className="icon-btn" onClick={e => handleDeleteList(l.id, e)}>🗑️</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <div className={s.addCard} onClick={() => { setEditingList(null); setShowListModal(true) }}>
                  <div className={s.addPlus}>＋</div>
                  <div>Створити список</div>
                </div>
              </div>
            )}
          </div>
        )}

        <Footer />
      </div>

      {showListModal && (
        <ListModal
          list={editingList}
          onClose={() => { setShowListModal(false); setEditingList(null) }}
          onSave={handleSaveList}
        />
      )}

      {showItemModal && selectedList && (
        <ItemModal
          listId={selectedList.id}
          item={editingItem}
          onClose={() => { setShowItemModal(false); setEditingItem(null) }}
          onSave={handleSaveItem}
        />
      )}
    </div>
  )
}
