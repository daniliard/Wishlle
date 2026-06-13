import { useRef, useEffect } from 'react'
import Footer from '../components/Footer'
import { loginTelegramOIDC } from '../api/client'

const TG_CLIENT_ID = import.meta.env.VITE_TG_CLIENT_ID

const features = [
  { icon: '🎁', title: 'Вішліст',         text: 'Додавай бажані речі, ділись списком з близькими одним посиланням.' },
  { icon: '👥', title: 'Друзі',            text: 'Дивись списки друзів, резервуй подарунки і більше не гадай що подарувати.' },
  { icon: '🗓️', title: 'Нагадування',     text: 'Всі важливі дати в одному місці. Telegram-бот нагадає за 7, 3 і 1 день.' },
]

function TgButton({ onLogin, id }) {
  const ref = useRef(null)

  useEffect(() => {
    const callbackName = `__tgAuth_${id}`
    window[callbackName] = async (data) => {
      if (data?.error || !data?.id_token) return
      try {
        await loginTelegramOIDC(data.id_token)
        onLogin()
      } catch (e) {
        console.error('TG auth error:', e)
      }
    }

    if (ref.current && TG_CLIENT_ID) {
      const s = document.createElement('script')
      s.async = true
      s.src   = 'https://telegram.org/js/telegram-login.js'
      s.setAttribute('data-telegram-login', TG_CLIENT_ID)
      s.setAttribute('data-size',           'large')
      s.setAttribute('data-onauth',         `${callbackName}(user)`)
      s.setAttribute('data-request-access', 'write')
      ref.current.innerHTML = ''
      ref.current.appendChild(s)
    }

    return () => { delete window[callbackName] }
  }, [])

  return <div ref={ref} style={{ minHeight: 52, display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
}

export default function LandingPage({ onLogin }) {
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)', fontFamily: "'Nunito', sans-serif" }}>
      {/* ── NAVBAR ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: 64,
        background: 'rgba(11,22,35,0.85)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 40px',
      }}>
        <span style={{ fontFamily: "'Dancing Script', cursive", fontSize: '1.6rem', color: 'var(--cyan)' }}>
          Wishlle
        </span>
        <div style={{ transform: 'scale(0.85)', transformOrigin: 'right center' }}>
          <TgButton onLogin={onLogin} id="nav" />
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 32, textAlign: 'center', padding: '80px 24px 40px',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
          width: 600, height: 300,
          background: 'radial-gradient(ellipse, rgba(0,200,232,0.08) 0%, transparent 70%)',
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

        <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', color: 'var(--muted)', lineHeight: 1.7, maxWidth: 520 }}>
          Зберігай мрії, діліться побажаннями з близькими.<br />
          Ніколи не забувай про важливі дати.
        </p>

        <TgButton onLogin={onLogin} id="hero" />

        <p style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
          Авторизація через Telegram — без паролів і реєстрації
        </p>

        <div style={{
          position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          color: 'var(--muted)', fontSize: '0.72rem',
        }}>
          <span>↓</span><span>Дізнатись більше</span>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: '80px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: '1.6rem', fontWeight: 900, marginBottom: 48 }}>Все в одному місці</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
          {features.map(f => (
            <div key={f.title} style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 20, padding: '28px 24px',
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: 'rgba(0,200,232,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.5rem', marginBottom: 16,
              }}>{f.icon}</div>
              <h3 style={{ fontWeight: 800, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '80px 24px', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: 12 }}>Готовий спробувати?</h2>
        <p style={{ color: 'var(--muted)', marginBottom: 32 }}>Приєднуйся через Telegram — займе 5 секунд.</p>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <TgButton onLogin={onLogin} id="cta" />
        </div>
      </section>

      <div style={{ padding: '0 40px' }}><Footer /></div>
    </div>
  )
}
