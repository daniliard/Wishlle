import { useRef, useEffect } from 'react'
import Footer from '../components/Footer'
import { loginTelegram } from '../api/client'

const BOT_USERNAME = 'Wishlle_bot'

const features = [
  {
    icon: '🎁',
    title: 'Вішліст',
    text: 'Додавай бажані речі, ділись списком з близькими одним посиланням.',
  },
  {
    icon: '👥',
    title: 'Друзі',
    text: 'Дивись списки друзів, резервуй подарунки і більше не гадай що подарувати.',
  },
  {
    icon: '🗓️',
    title: 'Нагадування',
    text: 'Всі важливі дати в одному місці. Telegram-бот нагадає за 7, 3 і 1 день.',
  },
]

export default function LandingPage({ onLogin }) {
  const widgetRef = useRef(null)

  useEffect(() => {
    window.__tgAuthCallback = async (user) => {
      if (!user || !user.hash) return

      try {
        const { hash, auth_date, ...userFields } = user
        const tgParams = new URLSearchParams()
        tgParams.set('user',      JSON.stringify(userFields))
        tgParams.set('auth_date', String(auth_date))
        tgParams.set('hash',      hash)
        await loginTelegram(tgParams.toString())
        onLogin()
      } catch (e) {
        console.error('Telegram auth error:', e)
      }
    }

    if (widgetRef.current) {
      const s = document.createElement('script')
      s.async = true
      s.src   = 'https://telegram.org/js/telegram-widget.js?22'
      s.setAttribute('data-telegram-login', BOT_USERNAME)
      s.setAttribute('data-size',           'large')
      s.setAttribute('data-onauth',         '__tgAuthCallback(user)')
      s.setAttribute('data-request-access', 'write')
      widgetRef.current.innerHTML = ''
      widgetRef.current.appendChild(s)
    }

    return () => { delete window.__tgAuthCallback }
  }, [])

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
        <span style={{ fontFamily: "'Dancing Script', cursive", fontSize: '1.6rem', color: 'var(--cyan)', cursor: 'default' }}>
          Wishlle
        </span>
        {/* маленький inline-widget для navbar */}
        <div id="nav-tg-btn" style={{ transform: 'scale(0.85)', transformOrigin: 'right center' }}>
          {/* клон кнопки через окремий div — react ре-монтує LandingPage, тому є тільки один ref */}
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 32, textAlign: 'center', padding: '80px 24px 40px',
        position: 'relative',
      }}>
        {/* Glow */}
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

        <h1 style={{
          fontFamily: "'Dancing Script', cursive",
          fontSize: 'clamp(4rem, 10vw, 8rem)',
          lineHeight: 1, marginBottom: 0,
        }}>
          Wish<span style={{ color: 'var(--cyan)' }}>lle</span>
        </h1>

        <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', color: 'var(--muted)', lineHeight: 1.7, maxWidth: 520 }}>
          Зберігай мрії, діліться побажаннями з близькими.<br />
          Ніколи не забувай про важливі дати.
        </p>

        {/* Telegram Login Widget */}
        <div ref={widgetRef} style={{ minHeight: 52 }} />

        <p style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
          Авторизація через Telegram — без паролів і реєстрації
        </p>

        {/* Scroll hint */}
        <div style={{
          position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          color: 'var(--muted)', fontSize: '0.72rem',
        }}>
          <span>↓</span>
          <span>Дізнатись більше</span>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: '80px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: '1.6rem', fontWeight: 900, marginBottom: 48 }}>
          Все в одному місці
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 24,
        }}>
          {features.map(f => (
            <div key={f.title} style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 20, padding: '28px 24px',
              transition: 'all 0.25s',
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: 'rgba(0,200,232,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.5rem', marginBottom: 16,
              }}>
                {f.icon}
              </div>
              <h3 style={{ fontWeight: 800, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{
        padding: '80px 24px', textAlign: 'center',
        borderTop: '1px solid var(--border)',
      }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: 12 }}>
          Готовий спробувати?
        </h2>
        <p style={{ color: 'var(--muted)', marginBottom: 32 }}>
          Приєднуйся через Telegram — займе 5 секунд.
        </p>
        {/* Ще один Widget тут — окремий елемент, один onload */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div id="cta-tg-btn" />
        </div>
      </section>

      <div style={{ padding: '0 40px' }}>
        <Footer />
      </div>
    </div>
  )
}
