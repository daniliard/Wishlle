import { useState } from 'react'
import { loginTelegramOIDC } from '../api/client'

const CLIENT_ID = 8624605092

export default function Login({ onLogin }) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  function handleClick() {
    setError(null)

    if (!window.Telegram?.Login?.auth) {
      setError('Telegram SDK ще завантажується, спробуй ще раз')
      return
    }

    setLoading(true)

    window.Telegram.Login.auth(
      { client_id: CLIENT_ID, request_access: ['write'] },
      async (data) => {
        if (!data) { setLoading(false); return }
        if (data.error) { setError('Telegram: ' + data.error); setLoading(false); return }
        try {
          await loginTelegramOIDC(data.id_token)
          onLogin()
        } catch (e) {
          setError(e.message)
          setLoading(false)
        }
      }
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28, padding: 24, background: 'var(--bg)' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontFamily: "'Dancing Script', cursive", fontSize: '3.5rem', lineHeight: 1, marginBottom: 10 }}>
          Wish<span style={{ color: 'var(--cyan)' }}>lle</span>
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '1rem' }}>Зберігай мрії, діліться побажаннями</p>
      </div>

      <button
        onClick={handleClick}
        disabled={loading}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
          padding: '14px 32px',
          background: '#229ED9', color: '#fff',
          border: 'none', borderRadius: 14,
          fontFamily: 'Nunito, sans-serif', fontSize: '1rem', fontWeight: 800,
          cursor: loading ? 'wait' : 'pointer',
          opacity: loading ? 0.7 : 1,
          boxShadow: '0 4px 20px rgba(34,158,217,0.35)',
          minWidth: 240, transition: 'all 0.2s',
        }}
        onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-2px)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = '' }}
      >
        {loading ? '⏳ Авторизація...' : (
          <>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.32 13.617l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.828.942z"/>
            </svg>
            Увійти через Telegram
          </>
        )}
      </button>

      {error && <p style={{ color: '#ff4d4d', fontSize: '0.9rem', textAlign: 'center', maxWidth: 280 }}>{error}</p>}

      <p style={{ color: 'var(--muted)', fontSize: '0.78rem', textAlign: 'center', maxWidth: 280 }}>
        Авторизація через Telegram — без паролів і реєстрації
      </p>
    </div>
  )
}
