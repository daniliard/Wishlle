import { useLanguage } from '../i18n/LanguageContext'

export default function Footer() {
  const { tr } = useLanguage()
  return (
    <footer className="site-footer">
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div className="footer-logo">Wishlle</div>
        <div className="footer-copy">© 2026 Wishlle. {tr('Дипломна робота ДТЕУ', 'Bachelor thesis, SUTE')}</div>
      </div>
      <div className="footer-links">
        <a>{tr('Про проєкт', 'About')}</a>
        <a>{tr('Допомога', 'Help')}</a>
        <a>{tr('Конфіденційність', 'Privacy')}</a>
      </div>
    </footer>
  )
}
