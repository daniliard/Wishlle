import { useEffect, useRef, useCallback, useState } from 'react'
import { loginTelegramOIDC, loginTelegram } from '../api/client'

const BOT_USERNAME = 'Wishlle_bot'
const CLIENT_ID    = '8624605092'

export default function Login({ onLogin }) {
  const btnRef            = useRef(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const handleAuth = useCallback(async (user) => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      if (user.id_token) {
        await loginTelegramOIDC(user.id_token)
      } else if (user.hash) {
        const { hash, auth_date, ...userFields } = user
        const p = new URLSearchParams()
        p.set('user',      JSON.stringify(userFields))
        p.set('auth_date', String(auth_date))
        p.set('hash',      hash)
        await loginTelegram(p.toString())
      } else {
        throw new Error('Не отримано даних авторизації')
      }
      onLogin()
    } catch (e) {
      setError(e.message)
      setLoading(false)
    }
  }, [onLogin])

  useEffect(() => {
    // Mini App
    const isMiniApp = window.location.search.includes('tgWebAppData') || navigator.userAgent.toLowerCase().includes('telegram')
    if (isMiniApp) {
      const s = document.createElement('script')
      s.src = 'https://telegram.org/js/telegram-web-app.js'
      s.async = true
      s.onload = () => {
        const initData = window.Telegram?.WebApp?.initData
        if (initData) {
          window.Telegram.WebApp.ready()
          window.Telegram.WebApp.expand()
          setLoading(true)
          loginTelegram(initData).then(() => onLogin()).catch(e => { setError(e.message); setLoading(false) })
        }
      }
      document.head.appendChild(s)
      return
    }

    // Браузер
    window.__tgLoginCb = (user) => handleAuth(user)

    const t = setTimeout(() => {
      if (!btnRef.current) return
      btnRef.current.innerHTML = ''
      const s = document.createElement('script')
      s.src = 'https://telegram.org/js/telegram-login.js'
      s.setAttribute('data-telegram-login',  BOT_USERNAME)
      s.setAttribute('data-client-id',       CLIENT_ID)
      s.setAttribute('data-size',            'large')
      s.setAttribute('data-onauth',          '__tgLoginCb(user)')
      s.setAttribute('data-request-access',  'write')
      s.setAttribute('data-userpic',         'false')
      btnRef.current.appendChild(s)
    }, 0)

    return () => { clearTimeout(t); delete window.__tgLoginCb }
  }, [handleAuth])

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>⏳</div>
        <p style={{ color: 'var(--muted)' }}>Авторизація...</p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28, padding: 24, background: 'var(--bg)' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontFamily: "'Dancing Script', cursive", fontSize: '3.5rem', lineHeight: 1, marginBottom: 10 }}>
          Wish<span style={{ color: 'var(--cyan)' }}>lle</span>
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '1rem' }}>Зберігай мрії, діліться побажаннями</p>
      </div>

      <div ref={btnRef} style={{ minHeight: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }} />

      {error && <p style={{ color: '#ff4d4d', fontSize: '0.9rem', textAlign: 'center', maxWidth: 280 }}>{error}</p>}

      <p style={{ color: 'var(--muted)', fontSize: '0.78rem', textAlign: 'center', maxWidth: 280 }}>
        Авторизація через Telegram — без паролів і реєстрації
      </p>
    </div>
  )
}
