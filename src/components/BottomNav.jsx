import s from './BottomNav.module.css'

const items = [
  { id: 'home',    icon: '🏠', label: 'Головна' },
  { id: 'lists',   icon: '📋', label: 'Списки' },
  { id: 'catalog', icon: '🔍', label: 'Каталог' },
  { id: 'friends', icon: '👥', label: 'Друзі' },
  { id: 'account', icon: '👤', label: 'Профіль' },
]

export default function BottomNav({ current, onNav }) {
  return (
    <nav className={s.nav}>
      {items.map(it => (
        <div
          key={it.id}
          className={`${s.item} ${current === it.id ? s.active : ''}`}
          onClick={() => onNav(it.id)}
        >
          <div className={s.icon}>{it.icon}</div>
          <div className={s.label}>{it.label}</div>
        </div>
      ))}
    </nav>
  )
}
