import { useEffect, useState } from 'react'

export default function AuthCallback() {
  const [status, setStatus] = useState('Завершуємо авторизацію...')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code   = params.get('code')
    const state  = params.get('state')
    const error  = params.get('error')

    if (error) {
      setStatus('Помилка: ' + error)
      // Пробуємо postMessage, якщо opener є
      try { window.opener?.postMessage({ type: 'tg_auth_error', error }, '*') } catch {}
      // Якщо opener немає — зберігаємо в sessionStorage і редіректимо
      sessionStorage.setItem('tg_auth_result', JSON.stringify({ error }))
      setTimeout(() => { window.location.href = '/' }, 1500)
      return
    }

    if (code && state) {
      setStatus('Авторизуємось...')

      // Варіант 1: є opener (popup) → postMessage
      if (window.opener && !window.opener.closed) {
        try {
          window.opener.postMessage({ type: 'tg_auth_code', code, returnedState: state }, '*')
          window.close()
          return
        } catch {}
      }

      // Варіант 2: немає opener (redirect flow) → зберігаємо і йдемо на головну
      sessionStorage.setItem('tg_auth_result', JSON.stringify({ code, state }))
      window.location.href = '/'
    }
  }, [])

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0b1623', color: '#eef4ff', fontFamily: 'Nunito, sans-serif',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: 12 }}>⏳</div>
        <p style={{ color: 'rgba(255,255,255,0.42)' }}>{status}</p>
      </div>
    </div>
  )
}
