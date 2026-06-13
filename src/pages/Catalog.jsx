import { useState, useEffect } from 'react'
import Footer from '../components/Footer'
import { getCatalog, getMyLists, createItem } from '../api/client'

const CATEGORIES = [
  { icon: '✨', label: 'Всі' },
  { icon: '💻', label: 'Техніка' },
  { icon: '📱', label: 'Гаджети' },
  { icon: '👟', label: 'Одяг' },
  { icon: '🏠', label: 'Дім' },
  { icon: '🎮', label: 'Ігри' },
  { icon: '📚', label: 'Книги' },
]

export default function Catalog({ onNav }) {
  const [products, setProducts]   = useState([])
  const [myLists, setMyLists]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [activeCat, setActiveCat] = useState(0)
  const [adding, setAdding]       = useState(null)
  const [addedTo, setAddedTo]     = useState({})       // itemId → listName
  const [pickFor, setPickFor]     = useState(null)     // item to add

  useEffect(() => {
    loadCatalog()
    loadLists()
  }, [])

  async function loadCatalog() {
    setLoading(true)
    try {
      const data = await getCatalog()
      setProducts(Array.isArray(data) ? data : [])
    } catch { setProducts([]) }
    finally { setLoading(false) }
  }

  async function loadLists() {
    try {
      const data = await getMyLists()
      setMyLists(Array.isArray(data) ? data : [])
    } catch { setMyLists([]) }
  }

  async function handleAddToList(product, listId) {
    const list = myLists.find(l => l.id === listId)
    setAdding(product.id)
    try {
      await createItem({
        title:      product.title,
        url:        product.url || null,
        price:      product.price || null,
        image_url:  product.image_url || null,
        wishlist_id: listId,
        status:     'available',
      })
      setAddedTo(prev => ({ ...prev, [product.id]: list?.title || 'Список' }))
      setPickFor(null)
      setTimeout(() => setAddedTo(prev => { const n = {...prev}; delete n[product.id]; return n }), 2500)
    } catch (e) { alert(e.message) }
    finally { setAdding(null) }
  }

  const filtered = products.filter(p => {
    const matchSearch = p.title?.toLowerCase().includes(search.toLowerCase())
    const matchCat    = activeCat === 0 || p.category === CATEGORIES[activeCat]?.label
    return matchSearch && matchCat
  })

  return (
    <div className="anim-fade-up">
      <div className="wrap">
        <div className="page-hero">
          <div><h1>Каталог 🛍️</h1><p>Знайди ідею для подарунка</p></div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 24, paddingTop: 36 }} className="catalog-layout">
          {/* Сайдбар */}
          <div style={{ position: 'sticky', top: 84, alignSelf: 'start' }} className="catalog-sidebar">
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 10 }}>Категорії</div>
              {CATEGORIES.map((c, i) => (
                <div key={c.label} onClick={() => setActiveCat(i)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', marginBottom: 2, transition: 'all 0.2s',
                    color: activeCat === i ? 'var(--cyan)' : 'var(--muted)',
                    background: activeCat === i ? 'var(--cyan-glow)' : 'transparent',
                  }}>
                  <span style={{ width: 20 }}>{c.icon}</span>
                  <span>{c.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Основна зона */}
          <div>
            <div className="search-wrap">
              <span className="s-icon">🔍</span>
              <input type="text" placeholder="Пошук у каталозі..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>Завантаження...</div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔍</div>
                <div>Нічого не знайдено</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 14, marginBottom: 60 }}>
                {filtered.map(p => (
                  <div key={p.id} style={{ background: 'var(--surface)', border: `1px solid ${addedTo[p.id] ? 'rgba(34,211,122,0.4)' : 'var(--border)'}`, borderRadius: 18, overflow: 'hidden', position: 'relative', transition: 'all 0.25s' }}
                    onMouseEnter={e => { if (!addedTo[p.id]) { e.currentTarget.querySelector('.ov')?.style && (e.currentTarget.querySelector('.ov').style.opacity = '1') } }}
                    onMouseLeave={e => { e.currentTarget.querySelector('.ov')?.style && (e.currentTarget.querySelector('.ov').style.opacity = '0') }}>
                    <div style={{ aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.6rem', background: 'rgba(0,200,232,0.04)' }}>
                      {p.image_url ? <img src={p.image_url} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🎁'}
                    </div>
                    <div style={{ padding: '10px 12px 12px' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: 4, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.title}</div>
                      {p.price && <div style={{ fontWeight: 900, fontSize: '0.88rem', color: 'var(--cyan)' }}>{Number(p.price).toLocaleString('uk-UA')} ₴</div>}
                    </div>

                    {addedTo[p.id] ? (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(34,211,122,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 6 }}>
                        <div style={{ fontSize: '1.5rem' }}>✓</div>
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--green)', textAlign: 'center', padding: '0 8px' }}>Додано до «{addedTo[p.id]}»</div>
                      </div>
                    ) : (
                      <div className="ov" style={{ position: 'absolute', inset: 0, background: 'rgba(0,200,232,0.1)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}>
                        {myLists.length === 0 ? (
                          <button className="btn-cyan" style={{ fontSize: '0.78rem', padding: '8px 14px' }} onClick={() => onNav('lists')}>Створи список →</button>
                        ) : myLists.length === 1 ? (
                          <button className="btn-cyan" style={{ fontSize: '0.78rem', padding: '8px 14px' }} onClick={() => handleAddToList(p, myLists[0].id)} disabled={adding === p.id}>
                            {adding === p.id ? '...' : '＋ В список'}
                          </button>
                        ) : (
                          <button className="btn-cyan" style={{ fontSize: '0.78rem', padding: '8px 14px' }} onClick={() => setPickFor(p)}>
                            ＋ В список
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <Footer />
      </div>

      {/* Пікер списку */}
      {pickFor && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={e => e.target === e.currentTarget && setPickFor(null)}>
          <div style={{ background: '#0f1e2e', border: '1px solid var(--border2)', borderRadius: 22, padding: 24, width: '100%', maxWidth: 360 }}>
            <div style={{ fontWeight: 900, fontSize: '1rem', marginBottom: 16 }}>В який список?</div>
            {myLists.map(l => (
              <div key={l.id} onClick={() => handleAddToList(pickFor, l.id)}
                style={{ padding: '11px 14px', borderRadius: 12, border: '1px solid var(--border)', marginBottom: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,200,232,0.4)'; e.currentTarget.style.color = 'var(--cyan)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = '' }}>
                {l.emoji || '🎁'} {l.title}
              </div>
            ))}
            <button className="btn-outline" style={{ width: '100%', marginTop: 8 }} onClick={() => setPickFor(null)}>Скасувати</button>
          </div>
        </div>
      )}

      <style>{`@media (max-width: 768px) { .catalog-layout { grid-template-columns: 1fr !important; } .catalog-sidebar { display: none; } }`}</style>
    </div>
  )
}
