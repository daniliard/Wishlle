import { useState, useEffect } from 'react'
import Footer from '../components/Footer'
import { getFriends, addFriend, searchUsers, getUserId } from '../api/client'
import { useLanguage } from '../i18n/LanguageContext'

export default function Friends() {
  const { tr } = useLanguage()
  const [friends, setFriends] = useState([])
  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(null)
  const myId = getUserId()

  useEffect(() => { loadFriends() }, [])

  async function loadFriends() {
    setLoading(true)
    try { const data = await getFriends(); setFriends(Array.isArray(data) ? data : []) }
    catch { setFriends([]) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    if (!search.trim()) { setResults([]); return }
    const timer = setTimeout(async () => {
      setSearching(true)
      try { const data = await searchUsers(search.trim()); setResults(Array.isArray(data) ? data.filter(u => u.id !== myId) : []) }
      catch { setResults([]) }
      finally { setSearching(false) }
    }, 400)
    return () => clearTimeout(timer)
  }, [search, myId])

  async function handleAdd(userId) {
    setAdding(userId)
    try { await addFriend(userId); loadFriends(); setSearch(''); setResults([]) }
    catch (e) { alert(e.message) }
    finally { setAdding(null) }
  }

  function daysUntilBirthday(dateStr) {
    if (!dateStr) return null
    const today = new Date(); today.setHours(0,0,0,0)
    const bday = new Date(dateStr); bday.setFullYear(today.getFullYear()); bday.setHours(0,0,0,0)
    if (bday < today) bday.setFullYear(today.getFullYear() + 1)
    return Math.round((bday - today) / 86400000)
  }

  const friendIds = new Set(friends.map(f => f.friend_id))
  const friendCountLabel = friends.length === 1 ? tr('друг', 'friend') : tr('друзів', 'friends')

  return (
    <div className="anim-fade-up">
      <div className="wrap">
        <div className="content-toolbar content-toolbar--simple"><div><strong>{friends.length} {friendCountLabel}</strong><span>{tr('Шукай користувачів за нікнеймом і додавай до свого кола', 'Find users by username and add them to your circle')}</span></div></div>

        <div style={{ paddingTop: 28, position: 'relative' }}>
          <div className="search-wrap"><span className="s-icon">🔍</span><input type="text" placeholder={tr('Знайти за нікнеймом...', 'Find by username...')} value={search} onChange={e => setSearch(e.target.value)} /></div>
          {(results.length > 0 || searching) && <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, background: '#0f1e2e', border: '1px solid var(--border2)', borderRadius: 14, padding: 8, boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
            {searching && <div style={{ padding: '10px 14px', color: 'var(--muted)', fontSize: '0.85rem' }}>{tr('Шукаємо...', 'Searching...')}</div>}
            {results.map(u => <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(0,200,232,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', overflow: 'hidden', flexShrink: 0 }}>{u.avatar_url ? <img src={u.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : '👤'}</div>
              <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{u.display_name || u.username}</div>{u.username && <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>@{u.username}</div>}</div>
              {friendIds.has(u.id) ? <span className="tag green">{tr('Вже друг', 'Already friends')}</span> : <button className="btn-sm cyan" onClick={() => handleAdd(u.id)} disabled={adding === u.id}>{adding === u.id ? '...' : `＋ ${tr('Додати', 'Add')}`}</button>}
            </div>)}
            {!searching && results.length === 0 && search.trim() && <div style={{ padding: '10px 14px', color: 'var(--muted)', fontSize: '0.85rem' }}>{tr('Нікого не знайдено', 'No users found')}</div>}
          </div>}
        </div>

        <div className="section-header" style={{ paddingTop: 32 }}><div className="section-title">{tr('Мої друзі', 'My friends')} ({friends.length})</div></div>
        {loading ? <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>{tr('Завантаження...', 'Loading...')}</div> : friends.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}><div style={{ fontSize: '3rem', marginBottom: 12 }}>👥</div><div style={{ fontWeight: 700, marginBottom: 8 }}>{tr('Поки немає друзів', 'No friends yet')}</div><div style={{ fontSize: '0.85rem' }}>{tr('Знайди друзів за нікнеймом вище', 'Find friends by username above')}</div></div>
        ) : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 14, marginBottom: 60 }}>{friends.map(f => {
          const u = f.friend || {}; const days = daysUntilBirthday(u.birth_date); const soon = days !== null && days <= 7
          return <div key={f.id} style={{ background: 'var(--surface)', border: `1px solid ${soon ? 'rgba(247,162,57,0.3)' : 'var(--border)'}`, borderRadius: 20, padding: 20, textAlign: 'center', cursor: 'pointer', transition: 'all 0.25s' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(0,200,232,0.12)', border: '2px solid rgba(0,200,232,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', margin: '0 auto 10px', overflow: 'hidden' }}>{u.avatar_url ? <img src={u.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : '👤'}</div>
            <div style={{ fontWeight: 800, fontSize: '0.92rem', marginBottom: 2 }}>{u.display_name || u.username || tr('Користувач', 'User')}</div>{u.username && <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginBottom: 8 }}>@{u.username}</div>}
            {days !== null && <div style={{ fontSize: '0.7rem', color: soon ? 'var(--orange)' : 'var(--muted)', fontWeight: soon ? 700 : 400, marginBottom: 12 }}>🎂 {days === 0 ? tr('Сьогодні! 🔥', 'Today! 🔥') : days === 1 ? tr('Завтра 🔥', 'Tomorrow 🔥') : tr(`${days} днів`, `${days} days`)}</div>}
            <button className="btn-sm cyan" style={{ width: '100%' }}>{tr('Переглянути списки', 'View lists')} →</button>
          </div>
        })}</div>}
        <Footer />
      </div>
    </div>
  )
}
