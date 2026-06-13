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
      setTimeout(() => window.location.replace('/'), 1200)
      return
    }

    publishAuthResult(payload)

    const message = {
    type: 'wishlle_tg_auth_result',
    payload,
    }

    try {
    window.opener?.postMessage(message, window.location.origin)
    } catch {}

    setStatus(
      payload.error
      ? 'Вхід скасовано.'
      : 'Готово! Закриваємо вікно…'
    )

      // Закриваємо popup у будь-якому випадку,
      // навіть якщо Telegram обнулив window.opener
    setTimeout(() => {
      window.close()

      // Якщо браузер чомусь не дозволив автоматично закрити
      setTimeout(() => {
      if (!window.closed) {
        setStatus('Вхід завершено. Це вікно можна закрити.')
      }
    }, 500)
    }, 250)

      // Якщо popup був перетворений браузером на звичайну вкладку або Telegram
      // повернув користувача в цю ж вкладку, головний App підхопить результат.
      setStatus(payload.error ? 'Вхід скасовано.' : 'Авторизуємось…')
      setTimeout(() => window.location.replace('/'), 250)
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
