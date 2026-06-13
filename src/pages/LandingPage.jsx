import { useCallback, useEffect, useRef, useState } from 'react'
import Footer from '../components/Footer'
import { loginGoogle } from '../api/client'
import { openTelegramLoginPopup } from '../auth/browserTelegram'
import { getGoogleClientId, loadGoogleIdentityServices } from '../auth/google'
import { looksLikeTelegramLaunch } from '../auth/telegram'

const features = [
  { icon: '🎁', title: 'Вішлісти', text: 'Створюй окремі списки для свят, покупок і мрій. Додавай бажання вручну або за посиланням.' },
  { icon: '👥', title: 'Друзі та подарунки', text: 'Переглядай списки друзів і резервуй подарунки, щоб ніхто не купив те саме.' },
  { icon: '🗓️', title: 'Події та нагадування', text: 'Зберігай важливі дати, плануй події та отримуй нагадування через Telegram-бота.' },
]

const steps = [
  { number: '01', title: 'Увійди за кілька секунд', text: 'Обери Telegram або Google — без окремого пароля та довгої реєстраційної форми.' },
  { number: '02', title: 'Створи свій список', text: 'Додай назву, фото, ціну, посилання та коментар до кожного бажаного подарунка.' },
  { number: '03', title: 'Поділись із близькими', text: 'Друзі побачать актуальний список і зможуть зарезервувати подарунок без спойлерів для тебе.' },
]

function TelegramLoginButton({ onLogin }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    if (loading) return
    setError('')
    setLoading(true)

    try {
      if (looksLikeTelegramLaunch()) {
        throw new Error('Telegram відкрив сайт як звичайне посилання, без initData. Закрий сторінку та відкрий Wishlle кнопкою «Відкрити Wishlle» після команди /start або через налаштований Mini App.')
      }
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
        className="tg-login-button"
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
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
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

function GoogleLoginButton({ ready, loading, error, onRenderError }) {
  const buttonRef = useRef(null)

  useEffect(() => {
    if (!ready || loading || !buttonRef.current || !window.google?.accounts?.id) return

    try {
      buttonRef.current.replaceChildren()
      window.google.accounts.id.renderButton(buttonRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'pill',
        logo_alignment: 'left',
        width: 300,
        locale: 'uk',
      })
    } catch (renderError) {
      onRenderError(renderError)
    }
  }, [ready, loading, onRenderError])

  return (
    <div className="google-login-wrap">
      {loading ? (
        <div className="google-login-loading">
          <span className="google-login-spinner" aria-hidden="true" />
          Входимо через Google…
        </div>
      ) : (
        <div ref={buttonRef} className="google-login-button-host" aria-label="Увійти через Google" />
      )}
      {!ready && !loading && !error && (
        <div className="google-login-loading">Завантажуємо Google…</div>
      )}
      {error && <p className="google-login-error">{error}</p>}
    </div>
  )
}

function AuthOptions({ onLogin, googleReady, googleLoading, googleError, onGoogleRenderError }) {
  return (
    <div className="auth-options">
      <TelegramLoginButton onLogin={onLogin} />
      <div className="auth-options__divider"><span>або</span></div>
      <GoogleLoginButton
        ready={googleReady}
        loading={googleLoading}
        error={googleError}
        onRenderError={onGoogleRenderError}
      />
    </div>
  )
}

export default function LandingPage({ onLogin }) {
  const [googleReady, setGoogleReady] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [googleError, setGoogleError] = useState('')

  const handleGoogleCredential = useCallback(async (response) => {
    const credential = response?.credential
    if (!credential) {
      setGoogleError('Google не повернув ID-токен. Спробуй ще раз.')
      return
    }

    setGoogleError('')
    setGoogleLoading(true)

    try {
      await loginGoogle(credential)
      onLogin()
    } catch (authError) {
      setGoogleError(authError?.message || 'Не вдалося увійти через Google.')
    } finally {
      setGoogleLoading(false)
    }
  }, [onLogin])

  const handleGoogleRenderError = useCallback((renderError) => {
    setGoogleError(renderError?.message || 'Не вдалося показати кнопку Google.')
  }, [])

  useEffect(() => {
    const clientId = getGoogleClientId()
    let cancelled = false

    if (!clientId) {
      setGoogleError('Не задано VITE_GOOGLE_CLIENT_ID у змінних середовища Vercel.')
      return undefined
    }

    loadGoogleIdentityServices()
      .then((google) => {
        if (cancelled) return

        google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleCredential,
          ux_mode: 'popup',
          context: 'signin',
          auto_select: false,
          cancel_on_tap_outside: true,
        })
        setGoogleReady(true)
      })
      .catch((loadError) => {
        if (!cancelled) {
          setGoogleError(loadError?.message || 'Не вдалося завантажити Google Identity Services.')
        }
      })

    return () => {
      cancelled = true
      try { window.google?.accounts?.id?.cancel() } catch {}
    }
  }, [handleGoogleCredential])

  return (
    <div className="landing-page">
      <nav className="landing-nav">
        <span className="landing-logo">Wishlle</span>
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

          <div className="landing-hero__highlights" aria-label="Переваги Wishlle">
            <span>🎁 Списки побажань</span>
            <span>🔒 Резервування без спойлерів</span>
            <span>📱 Браузер і Telegram</span>
          </div>

          <p className="landing-hero__promise">
            Один простір для власних бажань, списків друзів, подарунків і майбутніх подій.
          </p>

          <div className="landing-scroll-hint">
            <span>↓</span>
            <span>Дізнатись більше</span>
          </div>
        </section>

        <section className="landing-features">
          <div className="landing-section-heading">
            <span>Можливості</span>
            <h2>Все потрібне для подарунків — в одному місці</h2>
            <p>Не збирай посилання по чатах і нотатках. Wishlle тримає списки, статуси та важливі дати впорядкованими.</p>
          </div>

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

        <section className="landing-how" id="how-it-works">
          <div className="landing-section-heading">
            <span>Як це працює</span>
            <h2>Від входу до готового списку — три прості кроки</h2>
          </div>

          <div className="landing-step-grid">
            {steps.map((step) => (
              <article className="landing-step-card" key={step.number}>
                <div className="landing-step-card__number">{step.number}</div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-cta">
          <div className="landing-cta__glow" />
          <div className="landing-section-heading landing-section-heading--compact">
            <span>Почнемо?</span>
            <h2>Готовий спробувати?</h2>
            <p>Обери зручний спосіб входу — Telegram або Google.</p>
          </div>

          <AuthOptions
            onLogin={onLogin}
            googleReady={googleReady}
            googleLoading={googleLoading}
            googleError={googleError}
            onGoogleRenderError={handleGoogleRenderError}
          />

          <p className="landing-auth-note">
            🔐 Wishlle не створює і не зберігає паролі. Авторизація проходить через захищені сервіси Telegram або Google.
          </p>
        </section>
      </main>

      <div className="landing-footer"><Footer /></div>
    </div>
  )
}
