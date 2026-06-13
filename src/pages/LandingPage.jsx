import { useEffect, useState } from 'react'
import Footer from '../components/Footer'
import { loginTelegramOIDC, loginTelegram } from '../api/client'

const CLIENT_ID   = '8624605092'
const ORIGIN      = 'https://wishlle-4isp.vercel.app'

const features = [
  { icon: '🎁', title: 'Вішліст',     text: 'Додавай бажані речі, ділись списком з близькими одним посиланням.' },
  { icon: '👥', title: 'Друзі',        text: 'Дивись списки друзів, резервуй подарунки і більше не гадай що подарувати.' },
  { icon: '🗓️', title: 'Нагадування', text: 'Всі важливі дати в одному місці. Telegram-бот нагадає за 7, 3 і 1 день.' },
]

function TgLoginButton({ onLogin, label = 'Увійти через Telegram' }) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  function openPopup() {
    setError(null)
    const w = 550, h = 600
    const left = window.screenX + (window.outerWidth  - w) / 2
    const top  = window.screenY + (window.outerHeight - h) / 2

    const url = `https://oauth.telegram.org/auth?bot_id=${CLIENT_ID}&origin=${encodeURIComponent(ORIGIN)}&embed=1&request_access=write&return_to=${encodeURIComponent(ORIGIN)}`

    const popup = window.open(url, 'TelegramAuth', `width=${w},height=${h},left=${left},top=${top},toolbar=0,scrollbars=0,status=0,resizable=0,location=0,menuBar=0`)

    if (!popup) {
      setError('Браузер заблокував popup. Дозволь попапи для цього сайту.')
      return
    }

    setLoading(true)

    // Слухаємо повідомлення від popup
    function onMessage(e) {
      if (e.origin !== 'https://oauth.telegram.org') return
      const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data
      if (!data) return

      window.removeEventListener('message', onMessage)
      clearInterval(timer)
      popup.close()

      handleAuthData(data)
    }

    window.addEventListener('message', onMessage)

    // Запасний варіант — перевіряємо чи popup не закрився сам
    const timer = setInterval(() => {
      if (popup.closed) {
        clearInterval(timer)
        window.removeEventListener('message', onMessage)
        setLoading(false)
      }
    }, 500)
  }

  async function handleAuthData(data) {
    try {
      if (data.event === 'auth_result') {
        const user = data.result
        if (!user) throw new Error('Авторизацію скасовано')

        if (user.id_token) {
          await loginTelegramOIDC(user.id_token)
        } else {
          // Старий формат — hash
          const { hash, auth_date, ...fields } = user
          const p = new URLSearchParams()
          p.set('user',      JSON.stringify(fields))
          p.set('auth_date', String(auth_date))
          p.set('hash',      hash)
          await loginTelegram(p.toString())
        }
        onLogin()
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <button
        onClick={openPopup}
        disabled={loading}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
          padding: '14px 32px',
          background: '#229ED9', color: '#fff',
          border: 'none', borderRadius: 14,
          fontFamily: 'Nunito, sans-serif', fontSize: '1rem', fontWeight: 800,
          cursor: loading ? 'wait' : 'pointer',
          opacity: loading ? 0.7 : 1,
          transition: 'all 0.2s',
          boxShadow: '0 4px 20px rgba(34,158,217,0.35)',
          minWidth: 240,
        }}
        onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-2px)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = '' }}
      >
        {loading ? (
          '⏳ Авторизація...'
        ) : (
          <>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.32 13.617l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.828.942z"/>
            </svg>
            {label}
          </>
        )}
      </button>
      {error && (
        <p style={{ color: '#ff4d4d', fontSize: '0.82rem', textAlign: 'center', maxWidth: 300 }}>{error}</p>
      )}
    </div>
  )
}

export default function LandingPage({ onLogin }) {
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)', fontFamily: "'Nunito', sans-serif" }}>

      {/* NAVBAR */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: 64,
        background: 'rgba(11,22,35,0.85)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 40px',
      }}>
        <span style={{ fontFamily: "'Dancing Script', cursive", fontSize: '1.6rem', color: 'var(--cyan)' }}>Wishlle</span>
        <TgLoginButton onLogin={onLogin} label="Увійти" />
      </nav>

      {/* HERO */}
      <section style={{
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 28, textAlign: 'center', padding: '80px 24px 40px',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
          width: 700, height: 350,
          background: 'radial-gradient(ellipse, rgba(0,200,232,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(0,200,232,0.1)', border: '1px solid rgba(0,200,232,0.3)',
          borderRadius: 50, padding: '5px 18px',
          fontSize: '0.72rem', fontWeight: 700, color: 'var(--cyan)',
          letterSpacing: 2, textTransform: 'uppercase',
        }}>
          ✦ Безкоштовно · без реєстрації
        </div>

        <h1 style={{ fontFamily: "'Dancing Script', cursive", fontSize: 'clamp(4rem, 10vw, 8rem)', lineHeight: 1 }}>
          Wish<span style={{ color: 'var(--cyan)' }}>lle</span>
        </h1>

        <p style={{ fontSize: 'clamp(1rem, 2vw, 1.2rem)', color: 'var(--muted)', lineHeight: 1.7, maxWidth: 500 }}>
          Зберігай мрії, діліться побажаннями з близькими.<br />
          Ніколи не забувай про важливі дати.
        </p>

        <TgLoginButton onLogin={onLogin} />

        <p style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
          Авторизація через Telegram — без паролів і реєстрації
        </p>

        <div style={{
          position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
          color: 'var(--muted)', fontSize: '0.72rem',
        }}>
          <span>↓</span><span>Дізнатись більше</span>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding: '80px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: '1.6rem', fontWeight: 900, marginBottom: 48 }}>Все в одному місці</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
          {features.map(f => (
            <div key={f.title} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '28px 24px' }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(0,200,232,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: 16 }}>{f.icon}</div>
              <h3 style={{ fontWeight: 800, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 24px', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: 12 }}>Готовий спробувати?</h2>
        <p style={{ color: 'var(--muted)', marginBottom: 32 }}>Приєднуйся через Telegram — займе 5 секунд.</p>
        <TgLoginButton onLogin={onLogin} />
      </section>

      <div style={{ padding: '0 40px' }}><Footer /></div>
    </div>
  )
}
