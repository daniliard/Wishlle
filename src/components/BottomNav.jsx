import AppIcon from './AppIcons'
import { useLanguage } from '../i18n/LanguageContext'
import s from './BottomNav.module.css'

export default function BottomNav({ current, onNav }) {
  const { tr } = useLanguage()
  const items = [
    { id: 'home', icon: 'home', label: tr('Головна', 'Home') },
    { id: 'lists', icon: 'lists', label: tr('Списки', 'Lists') },
    { id: 'catalog', icon: 'catalog', label: tr('Каталог', 'Catalog') },
    { id: 'friends', icon: 'friends', label: tr('Друзі', 'Friends') },
    { id: 'account', icon: 'profile', label: tr('Профіль', 'Profile') },
  ]

  return (
    <nav className={s.nav} aria-label={tr('Мобільна навігація', 'Mobile navigation')}>
      {items.map(item => (
        <button type="button" key={item.id} className={`${s.item} ${current === item.id ? s.active : ''}`} onClick={() => onNav(item.id)}>
          <AppIcon name={item.icon} size={21} />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  )
}
