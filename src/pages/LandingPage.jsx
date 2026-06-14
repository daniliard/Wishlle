import { useCallback, useEffect, useRef, useState } from 'react'
import Footer from '../components/Footer'
import { loginGoogle } from '../api/client'
import { openTelegramLoginPopup } from '../auth/browserTelegram'
import { getGoogleClientId, loadGoogleIdentityServices } from '../auth/google'
import { looksLikeTelegramLaunch } from '../auth/telegram'
import { useLanguage } from '../i18n/LanguageContext'

function TelegramLoginButton({ onLogin }) {
  const { tr } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    if (loading) return
    setError('')
    setLoading(true)

    try {
      if (looksLikeTelegramLaunch()) {
        throw new Error(tr(
          'Telegram відкрив сайт як звичайне посилання, без initData. Закрий сторінку та відкрий Wishlle кнопкою «Відкрити Wishlle» після команди /start або через налаштований Mini App.',
          'Telegram opened the site as a regular link without initData. Close this page and open Wishlle using the “Open Wishlle” button after /start or through the configured Mini App.',
        ))
      }
      await openTelegramLoginPopup()
      onLogin()
    } catch (authError) {
      setError(authError?.message || tr('Не вдалося увійти через Telegram.', 'Could not sign in with Telegram.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="tg-login-wrap">
      <button type="button" className="tg-login-button" onClick={handleLogin} disabled={loading}>
        {loading ? (
          <><span className="tg-login-button__spinner" aria-hidden="true" />{tr('Очікуємо Telegram…', 'Waiting for Telegram…')}</>
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.32 13.617l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.828.942z" />
            </svg>
            {tr('Увійти через Telegram', 'Sign in with Telegram')}
          </>
        )}
      </button>
      {error && <p className="tg-login-error">{error}</p>}
    </div>
  )
}

function GoogleLoginButton({ ready, loading, error, onRenderError }) {
  const { language, tr } = useLanguage()
  const buttonRef = useRef(null)

  useEffect(() => {
    if (!ready || loading || !buttonRef.current || !window.google?.accounts?.id) return
    try {
      buttonRef.current.replaceChildren()
      window.google.accounts.id.renderButton(buttonRef.current, {
        type: 'standard', theme: 'outline', size: 'large', text: 'signin_with', shape: 'pill', logo_alignment: 'left', width: 300,
        locale: language === 'en' ? 'en' : 'uk',
      })
    } catch (renderError) { onRenderError(renderError) }
  }, [ready, loading, onRenderError, language])

  return (
    <div className="google-login-wrap">
      {loading ? (
        <div className="google-login-loading"><span className="google-login-spinner" aria-hidden="true" />{tr('Входимо через Google…', 'Signing in with Google…')}</div>
      ) : (
        <div ref={buttonRef} className="google-login-button-host" aria-label={tr('Увійти через Google', 'Sign in with Google')} />
      )}
      {!ready && !loading && !error && <div className="google-login-loading">{tr('Завантажуємо Google…', 'Loading Google…')}</div>}
      {error && <p className="google-login-error">{error}</p>}
    </div>
  )
}

function AuthOptions({ onLogin, googleReady, googleLoading, googleError, onGoogleRenderError }) {
  const { tr } = useLanguage()
  return (
    <div className="auth-options">
      <TelegramLoginButton onLogin={onLogin} />
      <div className="auth-options__divider"><span>{tr('або', 'or')}</span></div>
      <GoogleLoginButton ready={googleReady} loading={googleLoading} error={googleError} onRenderError={onGoogleRenderError} />
    </div>
  )
}

export default function LandingPage({ onLogin }) {
  const { language, setLanguage, tr } = useLanguage()
  const [googleReady, setGoogleReady] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [googleError, setGoogleError] = useState('')

  const features = [
    { icon: '🎁', title: tr('Вішлісти', 'Wishlists'), text: tr('Створюй окремі списки для свят, покупок і мрій. Додавай бажання вручну або за посиланням.', 'Create separate lists for celebrations, purchases and dreams. Add wishes manually or by link.') },
    { icon: '👥', title: tr('Друзі та подарунки', 'Friends and gifts'), text: tr('Переглядай списки друзів і резервуй подарунки, щоб ніхто не купив те саме.', 'Browse friends’ lists and reserve gifts so nobody buys the same thing.') },
    { icon: '🗓️', title: tr('Події та нагадування', 'Events and reminders'), text: tr('Зберігай важливі дати, плануй події та отримуй нагадування через Telegram-бота.', 'Save important dates, plan events and receive reminders through the Telegram bot.') },
  ]
  const steps = [
    { number: '01', title: tr('Увійди за кілька секунд', 'Sign in in seconds'), text: tr('Обери Telegram або Google — без окремого пароля та довгої реєстраційної форми.', 'Choose Telegram or Google—no separate password or long registration form.') },
    { number: '02', title: tr('Створи свій список', 'Create your list'), text: tr('Додай назву, фото, ціну, посилання та коментар до кожного бажаного подарунка.', 'Add a name, photo, price, link and note for every desired gift.') },
    { number: '03', title: tr('Поділись із близькими', 'Share with loved ones'), text: tr('Друзі побачать актуальний список і зможуть зарезервувати подарунок без спойлерів для тебе.', 'Friends will see the current list and reserve gifts without spoiling the surprise for you.') },
  ]

  const handleGoogleCredential = useCallback(async (response) => {
    const credential = response?.credential
    if (!credential) {
      setGoogleError(tr('Google не повернув ID-токен. Спробуй ще раз.', 'Google did not return an ID token. Try again.'))
      return
    }
    setGoogleError('')
    setGoogleLoading(true)
    try { await loginGoogle(credential); onLogin() }
    catch (authError) { setGoogleError(authError?.message || tr('Не вдалося увійти через Google.', 'Could not sign in with Google.')) }
    finally { setGoogleLoading(false) }
  }, [onLogin, tr])

  const handleGoogleRenderError = useCallback((renderError) => {
    setGoogleError(renderError?.message || tr('Не вдалося показати кнопку Google.', 'Could not display the Google button.'))
  }, [tr])

  useEffect(() => {
    const clientId = getGoogleClientId()
    let cancelled = false
    if (!clientId) {
      setGoogleError(tr('Не задано VITE_GOOGLE_CLIENT_ID у змінних середовища Vercel.', 'VITE_GOOGLE_CLIENT_ID is missing from Vercel environment variables.'))
      return undefined
    }
    loadGoogleIdentityServices().then((google) => {
      if (cancelled) return
      google.accounts.id.initialize({ client_id: clientId, callback: handleGoogleCredential, ux_mode: 'popup', context: 'signin', auto_select: false, cancel_on_tap_outside: true })
      setGoogleReady(true)
    }).catch((loadError) => {
      if (!cancelled) setGoogleError(loadError?.message || tr('Не вдалося завантажити Google Identity Services.', 'Could not load Google Identity Services.'))
    })
    return () => { cancelled = true; try { window.google?.accounts?.id?.cancel() } catch {} }
  }, [handleGoogleCredential, tr])

  return (
    <div className="landing-page">
      <nav className="landing-nav">
        <span className="landing-logo">Wishlle</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button type="button" className={`btn-sm ${language === 'uk' ? 'cyan' : ''}`} onClick={() => setLanguage('uk')} aria-pressed={language === 'uk'}>UA</button>
          <button type="button" className={`btn-sm ${language === 'en' ? 'cyan' : ''}`} onClick={() => setLanguage('en')} aria-pressed={language === 'en'}>EN</button>
        </div>
      </nav>

      <main>
        <section className="landing-hero">
          <div className="landing-hero__glow" />
          <div className="landing-badge">✦ {tr('Безкоштовно · без паролів', 'Free · passwordless')}</div>
          <h1>Wish<span>lle</span></h1>
          <p className="landing-hero__text">{tr('Зберігай мрії, ділись побажаннями з близькими', 'Save dreams, share wishes with loved ones')}<br />{tr('та не забувай про важливі дати.', 'and never forget important dates.')}</p>
          <div className="landing-hero__highlights" aria-label={tr('Переваги Wishlle', 'Wishlle benefits')}>
            <span>🎁 {tr('Списки побажань', 'Wishlists')}</span>
            <span>🔒 {tr('Резервування без спойлерів', 'Spoiler-free reservations')}</span>
            <span>📱 {tr('Браузер і Telegram', 'Browser and Telegram')}</span>
          </div>
          <p className="landing-hero__promise">{tr('Один простір для власних бажань, списків друзів, подарунків і майбутніх подій.', 'One place for your wishes, friends’ lists, gifts and upcoming events.')}</p>
          <div className="landing-scroll-hint"><span>↓</span><span>{tr('Дізнатись більше', 'Learn more')}</span></div>
        </section>

        <section className="landing-features">
          <div className="landing-section-heading"><span>{tr('Можливості', 'Features')}</span><h2>{tr('Все потрібне для подарунків — в одному місці', 'Everything you need for gifts—in one place')}</h2><p>{tr('Не збирай посилання по чатах і нотатках. Wishlle тримає списки, статуси та важливі дати впорядкованими.', 'Stop collecting links across chats and notes. Wishlle keeps lists, statuses and important dates organized.')}</p></div>
          <div className="landing-feature-grid">{features.map(feature => <article className="landing-feature-card" key={feature.title}><div className="landing-feature-card__icon">{feature.icon}</div><h3>{feature.title}</h3><p>{feature.text}</p></article>)}</div>
        </section>

        <section className="landing-how" id="how-it-works">
          <div className="landing-section-heading"><span>{tr('Як це працює', 'How it works')}</span><h2>{tr('Від входу до готового списку — три прості кроки', 'From sign-in to a ready list in three simple steps')}</h2></div>
          <div className="landing-step-grid">{steps.map(step => <article className="landing-step-card" key={step.number}><div className="landing-step-card__number">{step.number}</div><h3>{step.title}</h3><p>{step.text}</p></article>)}</div>
        </section>

        <section className="landing-cta">
          <div className="landing-cta__glow" />
          <div className="landing-section-heading landing-section-heading--compact"><span>{tr('Почнемо?', 'Ready?')}</span><h2>{tr('Готовий спробувати?', 'Ready to try?')}</h2><p>{tr('Обери зручний спосіб входу — Telegram або Google.', 'Choose a convenient sign-in method—Telegram or Google.')}</p></div>
          <AuthOptions onLogin={onLogin} googleReady={googleReady} googleLoading={googleLoading} googleError={googleError} onGoogleRenderError={handleGoogleRenderError} />
          <p className="landing-auth-note">🔐 {tr('Wishlle не створює і не зберігає паролі. Авторизація проходить через захищені сервіси Telegram або Google.', 'Wishlle does not create or store passwords. Authentication is handled by the secure Telegram or Google services.')}</p>
        </section>
      </main>
      <div className="landing-footer"><Footer /></div>
    </div>
  )
}
