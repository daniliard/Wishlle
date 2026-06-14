import { useEffect, useState } from 'react'
import { publishAuthResult } from '../auth/browserTelegram'
import { useLanguage } from '../i18n/LanguageContext'

export default function AuthCallback() {
  const { tr } = useLanguage()
  const [status, setStatus] = useState(tr('Завершуємо вхід…', 'Completing sign-in…'))

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const payload = {
      code: params.get('code'),
      state: params.get('state'),
      error: params.get('error'),
      error_description: params.get('error_description'),
    }

    if (!payload.code && !payload.error) {
      setStatus(tr('Telegram не повернув дані авторизації.', 'Telegram did not return authentication data.'))
      return
    }

    publishAuthResult(payload)
    const message = { type: 'wishlle_tg_auth_result', payload }

    try { window.opener?.postMessage(message, window.location.origin) } catch {}

    setStatus(payload.error ? tr('Вхід скасовано.', 'Sign-in cancelled.') : tr('Готово! Закриваємо вікно…', 'Done! Closing the window…'))

    setTimeout(() => {
      window.close()
      setTimeout(() => {
        if (!window.closed) setStatus(tr('Вхід завершено. Це вікно можна закрити.', 'Sign-in complete. You can close this window.'))
      }, 500)
    }, 250)
  }, [tr])

  return (
    <div className="auth-screen">
      <div className="auth-screen__card">
        <div className="auth-spinner" aria-hidden="true" />
        <p>{status}</p>
      </div>
    </div>
  )
}
