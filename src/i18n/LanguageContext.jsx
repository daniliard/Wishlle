import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'wishlle_language'
const LanguageContext = createContext(null)

function normalizeLanguage(value) {
  return value === 'en' ? 'en' : 'uk'
}

function detectInitialLanguage() {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) return normalizeLanguage(saved)
  return navigator.language?.toLowerCase().startsWith('en') ? 'en' : 'uk'
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(detectInitialLanguage)

  const setLanguage = useCallback((nextLanguage) => {
    const normalized = normalizeLanguage(nextLanguage)
    setLanguageState(normalized)
    localStorage.setItem(STORAGE_KEY, normalized)
  }, [])

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  const tr = useCallback((uk, en) => (language === 'en' ? en : uk), [language])
  const locale = language === 'en' ? 'en-US' : 'uk-UA'

  const value = useMemo(() => ({ language, setLanguage, tr, locale }), [language, locale, setLanguage, tr])
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider')
  return context
}
