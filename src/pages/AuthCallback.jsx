import { useEffect, useState } from 'react'

export default function AuthCallback() {
  const [status, setStatus] = useState('Завершуємо вхід...')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code   = params.get('code')
    const state  = params.get('state')
    const error  = params.get('error')

    // Чи це вікно — popup? (відкрите через window.open з нашого сайту)
    const hasOpener = !!window.opener && window.opener !== window

    if (error) {
      setStatus('Помилка: ' + error)
      if (hasOpener) {
        try { window.opener.postMessage({ type: 'tg_auth_error', error }, '*') } catch {}
      }
      sessionStorage.setItem('tg_auth_result', JSON.stringify({ error }))
      setTimeout(() => { if (hasOpener) window.close(); else window.location.replace('/') }, 800)
      return
    }

    if (code && state) {
      // Завжди пишемо результат в sessionStorage — це спільне сховище вкладок одного origin
      sessionStorage.setItem('tg_auth_result', JSON.stringify({ code, state }))

      // Якщо popup — повідомляємо батьківське вікно і закриваємось
      if (hasOpener) {
        try { window.opener.postMessage({ type: 'tg_auth_code', code, returnedState: state }, '*') } catch {}
        setStatus('Готово! Закриваємо вікно...')
        setTimeout(() => window.close(), 300)
        return
      }

      // Якщо це не popup (повний redirect) — йдемо на головну, App там підхопить
      setStatus('Авторизуємось...')
      window.location.replace('/')
    } else {
      setStatus('Невірний запит авторизації')
      setTimeout(() => window.location.replace('/'), 1000)
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
