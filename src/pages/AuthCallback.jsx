import { useEffect, useState } from 'react'
import { publishAuthResult } from '../auth/browserTelegram'

export default function AuthCallback() {
  const [status, setStatus] = useState('Завершуємо вхід…')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const payload = {
      code: params.get('code'),
      state: params.get('state'),
      error: params.get('error'),
      error_description: params.get('error_description'),
    }

    if (!payload.code && !payload.error) {
      setStatus('Telegram не повернув дані авторизації.')
      return
    }

    publishAuthResult(payload)

    const message = { type: 'wishlle_tg_auth_result', payload }

    try {
      window.opener?.postMessage(message, window.location.origin)
    } catch {
      // Результат уже передано через localStorage/BroadcastChannel.
    }

    setStatus(payload.error ? 'Вхід скасовано.' : 'Готово! Закриваємо вікно…')

    setTimeout(() => {
      window.close()

      setTimeout(() => {
        if (!window.closed) {
          setStatus('Вхід завершено. Це вікно можна закрити.')
        }
      }, 500)
    }, 250)
  }, [])

  return (
    <div className="auth-screen">
      <div className="auth-screen__card">
        <div className="auth-spinner" aria-hidden="true" />
        <p>{status}</p>
      </div>
    </div>
  )
}
