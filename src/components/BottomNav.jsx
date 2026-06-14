import AppIcon from './AppIcons'
import s from './BottomNav.module.css'

const items = [
  { id: 'home', icon: 'home', label: 'Головна' },
  { id: 'lists', icon: 'lists', label: 'Списки' },
  { id: 'catalog', icon: 'catalog', label: 'Каталог' },
  { id: 'friends', icon: 'friends', label: 'Друзі' },
  { id: 'account', icon: 'profile', label: 'Профіль' },
]

export default function BottomNav({ current, onNav }) {
  return (
    <nav className={s.nav} aria-label="Мобільна навігація">
      {items.map(item => (
        <button
          type="button"
          key={item.id}
          className={`${s.item} ${current === item.id ? s.active : ''}`}
          onClick={() => onNav(item.id)}
        >
          <AppIcon name={item.icon} size={21} />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  )
}
