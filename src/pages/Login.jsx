import { useEffect, useRef, useState } from 'react'
import { loginTelegram } from '../api/client'

export default function Login({ onLogin }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleTelegramResult(data) {
    if (data.error) {
      setError('Помилка авторизації: ' + data.error)
      return
    }
    setLoading(true)
    setError(null)
    try {
      // Новий API повертає id_token — передаємо на бекенд як Google токен
      // Але спочатку пробуємо через user дані
      const user = data.user
      const params = new URLSearchParams()
      params.set('user', JSON.stringify({
        id: user.id,
        first_name: user.name?.split(' ')[0] || '',
        last_name: user.name?.split(' ').slice(1).join(' ') || '',
        username: user.preferred_username || '',
        photo_url: user.picture || '',
        auth_date: user.iat || Math.floor(Date.now() / 1000),
      }))
      params.set('auth_date', String(user.iat || Math.floor(Date.now() / 1000)))
      params.set('hash', data.id_token)
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

    // Браузер — новий Telegram Login
    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-login.js'
    script.async = true
    script.onload = () => {
      if (window.Telegram?.Login) {
        window.Telegram.Login.init(
          {
            client_id: 8624605092,
            request_access: ['write'],
          },
          (data) => handleTelegramResult(data)
        )
      }
    }
    document.head.appendChild(script)

    return () => {
      document.head.removeChild(script)
    }
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
        <button
          className="btn-primary"
          onClick={() => window.Telegram?.Login?.open()}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '14px 24px', fontSize: '1rem', width: '100%' }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.32 13.617l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.828.942z"/>
          </svg>
          Увійти через Telegram
        </button>
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
