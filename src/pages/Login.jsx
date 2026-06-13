import { useEffect, useRef, useState } from 'react'
import { loginTelegramOIDC } from '../api/client'

// Bot's Client ID — отримати в BotFather → Bot Settings → Web Login
// Це НЕ bot_id, а окремий client_id (зазвичай збігається з bot_id, але треба перевірити)
const TG_CLIENT_ID = import.meta.env.VITE_TG_CLIENT_ID || "8624605092"

export default function Login({ onLogin }) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const btnRef                = useRef(null)

  useEffect(() => {
    // ── Telegram Mini App (відкрито всередині Telegram) ──────────────────
    const isMiniApp =
      window.location.search.includes('tgWebAppData') ||
      navigator.userAgent.toLowerCase().includes('telegram')

    if (isMiniApp) {
      const tgScript = document.createElement('script')
      tgScript.src   = 'https://telegram.org/js/telegram-web-app.js'
      tgScript.async = true
      tgScript.onload = () => {
        const initData = window.Telegram?.WebApp?.initData
        if (initData) {
          window.Telegram.WebApp.ready()
          window.Telegram.WebApp.expand()
          setLoading(true)
          // Mini App все ще використовує старий initData flow
          import('../api/client').then(({ loginTelegram }) =>
            loginTelegram(initData)
              .then(() => onLogin())
              .catch(e => { setError(e.message); setLoading(false) })
          )
        }
      }
      document.head.appendChild(tgScript)
      return
    }

    // ── Браузер: новий Telegram Login (OIDC / telegram-login.js) ─────────
    window.__tgAuthCallback = async (data) => {
      if (data?.error) {
        setError('Telegram: ' + data.error)
        return
      }
      if (!data?.id_token) {
        setError('Не отримано id_token від Telegram')
        return
      }
      setLoading(true)
      try {
        await loginTelegramOIDC(data.id_token)
        onLogin()
      } catch (e) {
        setError(e.message)
        setLoading(false)
      }
    }

    if (btnRef.current && TG_CLIENT_ID) {
      const s = document.createElement('script')
      s.async = true
      s.src   = 'https://telegram.org/js/telegram-login.js'
      s.setAttribute('data-telegram-login', TG_CLIENT_ID)
      s.setAttribute('data-size',           'large')
      s.setAttribute('data-onauth',         '__tgAuthCallback(user)')
      s.setAttribute('data-request-access', 'write')
      btnRef.current.innerHTML = ''
      btnRef.current.appendChild(s)
    }

    return () => { delete window.__tgAuthCallback }
  }, [])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>⏳</div>
          <p style={{ color: 'var(--muted)' }}>Авторизація...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 28, padding: 24, background: 'var(--bg)',
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontFamily: "'Dancing Script', cursive", fontSize: '3.5rem', lineHeight: 1, marginBottom: 10 }}>
          Wish<span style={{ color: 'var(--cyan)' }}>lle</span>
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '1rem' }}>
          Зберігай мрії, діліться побажаннями
        </p>
      </div>

      {!TG_CLIENT_ID && (
        <p style={{ color: '#f7a239', fontSize: '0.85rem', textAlign: 'center', maxWidth: 300 }}>
          ⚠️ VITE_TG_CLIENT_ID не задано в .env
        </p>
      )}

      <div ref={btnRef} style={{ minHeight: 52, display: 'flex', alignItems: 'center', justifyContent: 'center' }} />

      {error && (
        <p style={{ color: '#ff4d4d', fontSize: '0.9rem', textAlign: 'center', maxWidth: 280 }}>
          {error}
        </p>
      )}

      <p style={{ color: 'var(--muted)', fontSize: '0.78rem', textAlign: 'center', maxWidth: 280 }}>
        Авторизація через Telegram — без паролів і реєстрації
      </p>
    </div>
  )
}
