import { useState } from 'react'
import { loginTelegram } from '../api/client'

export default function Login({ onLogin }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleTelegram() {
    // Telegram Mini App
    if (window.Telegram?.WebApp?.initData) {
      setLoading(true)
      try {
        await loginTelegram(window.Telegram.WebApp.initData)
        onLogin()
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
      return
    }
    // Звичайний браузер — редірект на бота
    window.open(`https://t.me/Wishlle_bot`, '_blank')
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 320 }}>
        <button
          className="btn-primary"
          onClick={handleTelegram}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '14px 24px', fontSize: '1rem' }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.32 13.617l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.828.942z"/>
          </svg>
          {loading ? 'Завантаження...' : 'Увійти через Telegram'}
        </button>

        <button
          className="btn-outline"
          disabled
          style={{ padding: '14px 24px', fontSize: '1rem', opacity: 0.5, cursor: 'not-allowed' }}
        >
          Google (незабаром)
        </button>
      </div>

      {error && (
        <p style={{ color: '#ff4d4d', fontSize: '0.9rem', textAlign: 'center' }}>{error}</p>
      )}

      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', maxWidth: 280 }}>
        Авторизація відбувається через Telegram — без паролів і реєстрації
      </p>
    </div>
  )
}
