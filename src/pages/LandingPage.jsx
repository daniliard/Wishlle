import { useState } from 'react'
import Footer from '../components/Footer'
import { generateCodeVerifier, generateCodeChallenge } from '../auth/pkce'

const CLIENT_ID    = '8624605092'
const REDIRECT_URI = 'https://wishlle-4isp.vercel.app/auth/callback'

const features = [
  { icon: '🎁', title: 'Вішліст',      text: 'Додавай бажані речі, ділись списком з близькими одним посиланням.' },
  { icon: '👥', title: 'Друзі',         text: 'Дивись списки друзів, резервуй подарунки і більше не гадай що подарувати.' },
  { icon: '🗓️', title: 'Нагадування',  text: 'Всі важливі дати в одному місці. Telegram-бот нагадає за 7, 3 і 1 день.' },
]

function TgButton({ onLogin, small = false }) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  async function handleClick() {
    setError(null)
    setLoading(true)

    try {
      // 1. Генеруємо PKCE
      const verifier   = generateCodeVerifier()
      const challenge  = await generateCodeChallenge(verifier)
      const state      = generateCodeVerifier() // random state для CSRF

      // Зберігаємо у sessionStorage — прочитаємо на /auth/callback
      sessionStorage.setItem('tg_code_verifier', verifier)
      sessionStorage.setItem('tg_state', state)

      // 2. Будуємо URL авторизації
      const url = new URL('https://oauth.telegram.org/auth')
      url.searchParams.set('client_id',             CLIENT_ID)
      url.searchParams.set('redirect_uri',          REDIRECT_URI)
      url.searchParams.set('response_type',         'code')
      url.searchParams.set('scope',                 'openid profile')
      url.searchParams.set('state',                 state)
      url.searchParams.set('code_challenge',        challenge)
      url.searchParams.set('code_challenge_method', 'S256')

      // 3. Відкриваємо popup
      const w = 550, h = 620
      const left = window.screenX + (window.outerWidth  - w) / 2
      const top  = window.screenY + (window.outerHeight - h) / 2
      const popup = window.open(
        url.toString(),
        'TelegramLogin',
        `width=${w},height=${h},left=${left},top=${top},toolbar=0,scrollbars=0,status=0`
      )

      if (!popup) {
        setError('Браузер заблокував popup. Дозволь спливаючі вікна для цього сайту.')
        setLoading(false)
        return
      }

      // 4. Чекаємо поки popup редіректне на /auth/callback і закриється
      //    Callback-сторінка зробить postMessage назад
      const onMessage = async (e) => {
        if (e.origin !== window.location.origin) return
        if (e.data?.type !== 'tg_auth_code') return

        window.removeEventListener('message', onMessage)
        clearInterval(closedTimer)

        const { code, returnedState } = e.data

        if (returnedState !== state) {
          setError('Помилка безпеки: невірний state')
          setLoading(false)
          return
        }

        try {
          // 5. Відправляємо code + verifier на бекенд
          const res = await fetch(
            'https://wishllebackend-production.up.railway.app/api/auth/telegram/callback',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ code, code_verifier: verifier }),
            }
          )
          if (!res.ok) {
            const err = await res.json()
            throw new Error(err.detail || 'Помилка авторизації')
          }
          const data = await res.json()
          localStorage.setItem('wishlle_token',   data.access_token)
          localStorage.setItem('wishlle_user_id', data.user_id)
          localStorage.setItem('wishlle_user',    JSON.stringify(data.user))
          onLogin()
        } catch (e) {
          setError(e.message)
          setLoading(false)
        }
      }

      window.addEventListener('message', onMessage)

      // Якщо юзер просто закрив popup
      const closedTimer = setInterval(() => {
        if (popup.closed) {
          clearInterval(closedTimer)
          window.removeEventListener('message', onMessage)
          setLoading(false)
        }
      }, 500)

    } catch (e) {
      setError(e.message)
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <button
        onClick={handleClick}
        disabled={loading}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          padding: small ? '9px 20px' : '14px 32px',
          background: '#229ED9', color: '#fff',
          border: 'none', borderRadius: 12,
          fontFamily: 'Nunito, sans-serif',
          fontSize: small ? '0.85rem' : '1rem',
          fontWeight: 800,
          cursor: loading ? 'wait' : 'pointer',
          opacity: loading ? 0.7 : 1,
          transition: 'all 0.2s',
          boxShadow: '0 4px 20px rgba(34,158,217,0.3)',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-2px)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = '' }}
      >
        {loading ? '⏳ Авторизація...' : (
          <>
            <svg width={small ? 18 : 22} height={small ? 18 : 22} viewBox="0 0 24 24" fill="white">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.32 13.617l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.828.942z"/>
            </svg>
            Увійти через Telegram
          </>
        )}
      </button>
      {error && <p style={{ color: '#ff4d4d', fontSize: '0.8rem', textAlign: 'center', maxWidth: 300, margin: 0 }}>{error}</p>}
    </div>
  )
}

export default function LandingPage({ onLogin }) {
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)', fontFamily: "'Nunito', sans-serif" }}>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: 64,
        background: 'rgba(11,22,35,0.85)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 40px',
      }}>
        <span style={{ fontFamily: "'Dancing Script', cursive", fontSize: '1.6rem', color: 'var(--cyan)' }}>Wishlle</span>
        <TgButton onLogin={onLogin} small />
      </nav>

      <section style={{
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 28, textAlign: 'center', padding: '80px 24px 40px', position: 'relative',
      }}>
        <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 700, height: 350, background: 'radial-gradient(ellipse, rgba(0,200,232,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(0,200,232,0.1)', border: '1px solid rgba(0,200,232,0.3)', borderRadius: 50, padding: '5px 18px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--cyan)', letterSpacing: 2, textTransform: 'uppercase' }}>
          ✦ Безкоштовно · без реєстрації
        </div>

        <h1 style={{ fontFamily: "'Dancing Script', cursive", fontSize: 'clamp(4rem, 10vw, 8rem)', lineHeight: 1 }}>
          Wish<span style={{ color: 'var(--cyan)' }}>lle</span>
        </h1>

        <p style={{ fontSize: 'clamp(1rem, 2vw, 1.2rem)', color: 'var(--muted)', lineHeight: 1.7, maxWidth: 500 }}>
          Зберігай мрії, діліться побажаннями з близькими.<br />Ніколи не забувай про важливі дати.
        </p>

        <TgButton onLogin={onLogin} />

        <p style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>Авторизація через Telegram — без паролів і реєстрації</p>

        <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, color: 'var(--muted)', fontSize: '0.72rem' }}>
          <span>↓</span><span>Дізнатись більше</span>
        </div>
      </section>

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

      <section style={{ padding: '80px 24px', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: 12 }}>Готовий спробувати?</h2>
        <p style={{ color: 'var(--muted)', marginBottom: 32 }}>Приєднуйся через Telegram — займе 5 секунд.</p>
        <TgButton onLogin={onLogin} />
      </section>

      <div style={{ padding: '0 40px' }}><Footer /></div>
    </div>
  )
}
