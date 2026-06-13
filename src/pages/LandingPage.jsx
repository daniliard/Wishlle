import { useState } from 'react'
import Footer from '../components/Footer'
import { openTelegramLoginPopup } from '../auth/browserTelegram'

const features = [
  { icon: '🎁', title: 'Вішліст', text: 'Додавай бажані речі та ділись списком з близькими одним посиланням.' },
  { icon: '👥', title: 'Друзі', text: 'Дивись списки друзів, резервуй подарунки й більше не гадай, що подарувати.' },
  { icon: '🗓️', title: 'Нагадування', text: 'Усі важливі дати в одному місці. Telegram-бот нагадає про подію заздалегідь.' },
]

function TelegramLoginButton({ onLogin, small = false }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    if (loading) return
    setError('')
    setLoading(true)

    try {
      await openTelegramLoginPopup()
      onLogin()
    } catch (authError) {
      setError(authError?.message || 'Не вдалося увійти через Telegram.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="tg-login-wrap">
      <button
        type="button"
        className={`tg-login-button${small ? ' tg-login-button--small' : ''}`}
        onClick={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <>
            <span className="tg-login-button__spinner" aria-hidden="true" />
            Очікуємо Telegram…
          </>
        ) : (
          <>
            <svg width={small ? 18 : 22} height={small ? 18 : 22} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.32 13.617l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.828.942z" />
            </svg>
            Увійти через Telegram
          </>
        )}
      </button>
      {error && <p className="tg-login-error">{error}</p>}
    </div>
  )
}

export default function LandingPage({ onLogin }) {
  return (
    <div className="landing-page">
      <nav className="landing-nav">
        <span className="landing-logo">Wishlle</span>
        <TelegramLoginButton onLogin={onLogin} small />
      </nav>

      <main>
        <section className="landing-hero">
          <div className="landing-hero__glow" />
          <div className="landing-badge">✦ Безкоштовно · без паролів</div>

          <h1>
            Wish<span>lle</span>
          </h1>

          <p className="landing-hero__text">
            Зберігай мрії, ділись побажаннями з близькими<br />
            та не забувай про важливі дати.
          </p>

          <TelegramLoginButton onLogin={onLogin} />
          <p className="landing-auth-note">У браузері відкриється захищене вікно Telegram для підтвердження входу.</p>

          <div className="landing-scroll-hint">
            <span>↓</span>
            <span>Дізнатись більше</span>
          </div>
        </section>

        <section className="landing-features">
          <h2>Все в одному місці</h2>
          <div className="landing-feature-grid">
            {features.map((feature) => (
              <article className="landing-feature-card" key={feature.title}>
                <div className="landing-feature-card__icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-cta">
          <h2>Готовий спробувати?</h2>
          <p>Підтвердження через Telegram займає кілька секунд.</p>
          <TelegramLoginButton onLogin={onLogin} />
        </section>
      </main>

      <div className="landing-footer"><Footer /></div>
    </div>
  )
}
