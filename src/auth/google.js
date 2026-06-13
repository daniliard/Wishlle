const GOOGLE_SCRIPT_ID = 'wishlle-google-identity-services'
const GOOGLE_SCRIPT_SRC = 'https://accounts.google.com/gsi/client'

let loaderPromise = null

export function getGoogleClientId() {
  return String(import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim()
}

export function loadGoogleIdentityServices() {
  if (window.google?.accounts?.id) {
    return Promise.resolve(window.google)
  }

  if (loaderPromise) return loaderPromise

  loaderPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(GOOGLE_SCRIPT_ID)

    const handleLoaded = () => {
      if (window.google?.accounts?.id) {
        resolve(window.google)
      } else {
        reject(new Error('Google Identity Services завантажився, але API недоступний.'))
      }
    }

    if (existing) {
      existing.addEventListener('load', handleLoaded, { once: true })
      existing.addEventListener(
        'error',
        () => reject(new Error('Не вдалося завантажити Google Identity Services.')),
        { once: true },
      )
      return
    }

    const script = document.createElement('script')
    script.id = GOOGLE_SCRIPT_ID
    script.src = GOOGLE_SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = handleLoaded
    script.onerror = () => reject(new Error('Не вдалося завантажити Google Identity Services.'))
    document.head.appendChild(script)
  }).catch((error) => {
    loaderPromise = null
    throw error
  })

  return loaderPromise
}
