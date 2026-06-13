import { useEffect } from 'react'

export default function AuthCallback() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code  = params.get('code')
    const state = params.get('state')
    const error = params.get('error')

    if (error) {
      if (window.opener) {
        window.opener.postMessage({ type: 'tg_auth_error', error }, window.location.origin)
      }
      window.close()
      return
    }

    if (code && state) {
      if (window.opener) {
        window.opener.postMessage({ type: 'tg_auth_code', code, returnedState: state }, window.location.origin)
      }
      window.close()
    }
  }, [])

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0b1623', color: '#eef4ff', fontFamily: 'Nunito, sans-serif',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: 12 }}>⏳</div>
        <p style={{ color: 'rgba(255,255,255,0.4)' }}>Завершуємо авторизацію...</p>
      </div>
    </div>
  )
}
