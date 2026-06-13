import { useEffect, useRef, useState } from 'react'
import { loginTelegram } from '../api/client'

export default function Login({ onLogin }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const widgetRef = useRef(null)

  async function handleTelegramAuth(telegramUser) {
    setLoading(true)
    setError(null)
    try {
      // Конвертуємо дані від віджету в initData формат
      const params = new URLSearchParams()
      const user = {
        id: telegramUser.id,
        first_name: telegramUser.first_name,
        last_name: telegramUser.last_name,
        username: telegramUser.username,
        photo_url: telegramUser.photo_url,
        auth_date: telegramUser.auth_date,
      }
      params.set('user', JSON.stringify(user))
      params.set('auth_date', String(telegramUser.auth_date))
      params.set('hash', telegramUser.hash)

      await loginTelegram(params.toString())
      onLogin()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Mini App — автологін
    if (window.Telegram?.WebApp?.initData) {
      setLoading(true)
      loginTelegram(window.Telegram.WebApp.initData)
        .then(() => onLogin())
        .catch(e => { setError(e.message); setLoading(false) })
      return
    }

    // Браузер — Telegram Login Widget
    window.onTelegramAuth = handleTelegramAuth

    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.setAttribute('data-telegram-login', 'Wishlle_bot')
    script.setAttribute('data-size', 'large')
    script.setAttribute('data-onauth', 'onTelegramAuth(user)')
    script.setAttribute('data-request-access', 'write')
    script.async = true

    if (widgetRef.current) {
      widgetRef.current.innerHTML = ''
      widgetRef.current.appendChild(script)
    }

    return () => { delete window.onTelegramAuth }
  }, [])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: 16 }}>⏳</div>
          <p style={{ color: 'var(--text-muted)' }}>Авторизація...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 24,
      padding: 24,
      background: 'var(--bg)',
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: 8 }}>
          Wish<span style={{ color: 'var(--cyan)' }}>lle</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
          Зберігай мрії, діліться побажаннями
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: '100%', maxWidth: 320 }}>
        <div ref={widgetRef} style={{ minHeight: 48 }} />
      </div>

      {error && (
        <p style={{ color: '#ff4d4d', fontSize: '0.9rem', textAlign: 'center', maxWidth: 280 }}>{error}</p>
      )}

      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', maxWidth: 280 }}>
        Авторизація через Telegram — без паролів і реєстрації
      </p>
    </div>
  )
}
