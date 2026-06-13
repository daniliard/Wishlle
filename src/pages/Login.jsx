import { useEffect, useRef, useState } from 'react'
import { loginTelegram } from '../api/client'

const BOT_USERNAME = 'Wishlle_bot'   // без @

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
          loginTelegram(initData)
            .then(() => onLogin())
            .catch(e => { setError(e.message); setLoading(false) })
        }
      }
      document.head.appendChild(tgScript)
      return
    }

    // ── Браузер: Telegram Login Widget ───────────────────────────────────
    // Глобальний callback — викликається Telegram-скриптом після авторизації
    window.__tgAuthCallback = async (user) => {
      if (!user || !user.hash) {
        setError('Авторизація скасована або невдала')
        return
      }
      setLoading(true)
      try {
        // Будуємо init_data-рядок у форматі, який розуміє бекенд
        const params = new URLSearchParams()
        params.set('id',         String(user.id))
        params.set('first_name', user.first_name || '')
        if (user.last_name)  params.set('last_name',  user.last_name)
        if (user.username)   params.set('username',   user.username)
        if (user.photo_url)  params.set('photo_url',  user.photo_url)
        params.set('auth_date',  String(user.auth_date))
        params.set('hash',       user.hash)

        // Пакуємо як user JSON + hash — бекенд verify_telegram_init_data
        // очікує urlencoded рядок. Тому вкладаємо user-поля у поле "user"
        const tgParams = new URLSearchParams()
        const { hash, auth_date, ...userFields } = user
        tgParams.set('user',      JSON.stringify(userFields))
        tgParams.set('auth_date', String(auth_date))
        tgParams.set('hash',      hash)

        await loginTelegram(tgParams.toString())
        onLogin()
      } catch (e) {
        setError(e.message)
        setLoading(false)
      }
    }

    // Вставляємо Telegram Login Widget-скрипт
    if (btnRef.current) {
      const s           = document.createElement('script')
      s.async           = true
      s.src             = 'https://telegram.org/js/telegram-widget.js?22'
      s.setAttribute('data-telegram-login',  BOT_USERNAME)
      s.setAttribute('data-size',            'large')
      s.setAttribute('data-onauth',          '__tgAuthCallback(user)')
      s.setAttribute('data-request-access',  'write')
      btnRef.current.innerHTML = ''
      btnRef.current.appendChild(s)
    }

    return () => {
      delete window.__tgAuthCallback
    }
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

      {/* Telegram Login Widget рендериться всередині цього div */}
      <div ref={btnRef} style={{ minHeight: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }} />

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
