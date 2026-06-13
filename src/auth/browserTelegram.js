import { finishBrowserLogin } from '../api/client'
import { generateCodeChallenge, generateCodeVerifier } from './pkce'

const AUTH_REQUEST_KEY = 'wishlle_tg_auth_request'
const AUTH_RESULT_KEY = 'wishlle_tg_auth_result'
const AUTH_CHANNEL = 'wishlle_telegram_auth'
const AUTH_MAX_AGE_MS = 10 * 60 * 1000

function getConfig() {
  const clientId = String(import.meta.env.VITE_TG_CLIENT_ID || '').trim()
  const redirectUri = String(
    import.meta.env.VITE_TG_REDIRECT_URI || `${window.location.origin}/auth/callback`,
  ).trim()

  if (!clientId) {
    throw new Error('Не задано VITE_TG_CLIENT_ID у змінних середовища Vercel.')
  }

  return { clientId, redirectUri }
}

function saveRequest(request) {
  localStorage.setItem(AUTH_REQUEST_KEY, JSON.stringify(request))
}

function readRequest() {
  try {
    const raw = localStorage.getItem(AUTH_REQUEST_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (!data?.state || !data?.verifier || !data?.createdAt) return null
    if (Date.now() - data.createdAt > AUTH_MAX_AGE_MS) {
      clearBrowserAuthStorage()
      return null
    }
    return data
  } catch {
    return null
  }
}

function readResult() {
  try {
    const raw = localStorage.getItem(AUTH_RESULT_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function clearBrowserAuthStorage() {
  localStorage.removeItem(AUTH_REQUEST_KEY)
  localStorage.removeItem(AUTH_RESULT_KEY)
}

export function publishAuthResult(result) {
  localStorage.setItem(AUTH_RESULT_KEY, JSON.stringify({ ...result, createdAt: Date.now() }))

  if ('BroadcastChannel' in window) {
    const channel = new BroadcastChannel(AUTH_CHANNEL)
    channel.postMessage(result)
    channel.close()
  }
}

function buildAuthorizationUrl({ clientId, redirectUri, state, challenge }) {
  const url = new URL('https://oauth.telegram.org/auth')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', 'openid profile')
  url.searchParams.set('state', state)
  url.searchParams.set('code_challenge', challenge)
  url.searchParams.set('code_challenge_method', 'S256')
  return url.toString()
}

async function exchangeResult(result) {
  const request = readRequest()
  if (!request) {
    clearBrowserAuthStorage()
    throw new Error('Сесію входу не знайдено або вона вже застаріла. Спробуй увійти ще раз.')
  }

  if (result?.error) {
    clearBrowserAuthStorage()
    throw new Error(`Telegram: ${result.error_description || result.error}`)
  }

  if (!result?.code || !result?.state) {
    clearBrowserAuthStorage()
    throw new Error('Telegram не повернув код авторизації.')
  }

  if (result.state !== request.state) {
    clearBrowserAuthStorage()
    throw new Error('Помилка безпеки: state не збігається.')
  }

  const data = await finishBrowserLogin(result.code, request.verifier)
  clearBrowserAuthStorage()
  return data
}

export async function completeStoredBrowserLogin() {
  const result = readResult()
  if (!result) return null
  return exchangeResult(result)
}

export async function openTelegramLoginPopup() {
  const { clientId, redirectUri } = getConfig()

  // Відкриваємо вікно синхронно прямо всередині кліку. Інакше браузер може
  // заблокувати popup, поки ми асинхронно рахуємо PKCE challenge.
  const width = Math.min(560, window.screen.availWidth || 560)
  const height = Math.min(720, window.screen.availHeight || 720)
  const left = Math.max(0, window.screenX + (window.outerWidth - width) / 2)
  const top = Math.max(0, window.screenY + (window.outerHeight - height) / 2)

  const popup = window.open(
    'about:blank',
    'WishlleTelegramLogin',
    `popup=yes,width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`,
  )

  if (!popup) {
    throw new Error('Браузер заблокував popup. Дозволь спливаючі вікна для Wishlle та натисни ще раз.')
  }

  try {
    popup.document.title = 'Вхід через Telegram'
    popup.document.body.innerHTML = '<p style="font-family:system-ui;padding:24px">Відкриваємо Telegram…</p>'
  } catch {
    // Деякі браузери не дозволяють змінити about:blank — це не критично.
  }

  const verifier = generateCodeVerifier()
  const challenge = await generateCodeChallenge(verifier)
  const state = generateCodeVerifier()

  clearBrowserAuthStorage()
  saveRequest({ state, verifier, redirectUri, createdAt: Date.now() })

  popup.location.replace(buildAuthorizationUrl({ clientId, redirectUri, state, challenge }))

  return new Promise((resolve, reject) => {
    let settled = false
    let channel = null
    let pollTimer = null
    let closeTimer = null
    let timeoutTimer = null

    const cleanup = () => {
      window.removeEventListener('message', onMessage)
      window.removeEventListener('storage', onStorage)
      if (channel) channel.close()
      if (pollTimer) clearInterval(pollTimer)
      if (closeTimer) clearInterval(closeTimer)
      if (timeoutTimer) clearTimeout(timeoutTimer)
    }

    const finish = async (result) => {
      if (settled) return
      settled = true
      cleanup()
      try {
        const data = await exchangeResult(result)
        try { if (!popup.closed) popup.close() } catch {}
        resolve(data)
      } catch (error) {
        clearBrowserAuthStorage()
        try { if (!popup.closed) popup.close() } catch {}
        reject(error)
      }
    }

    const fail = (error) => {
      if (settled) return
      settled = true
      cleanup()
      clearBrowserAuthStorage()
      reject(error instanceof Error ? error : new Error(String(error)))
    }

    function onMessage(event) {
      if (event.origin !== window.location.origin) return
      if (event.data?.type !== 'wishlle_tg_auth_result') return
      finish(event.data.payload)
    }

    function onStorage(event) {
      if (event.key !== AUTH_RESULT_KEY || !event.newValue) return
      try { finish(JSON.parse(event.newValue)) } catch {}
    }

    window.addEventListener('message', onMessage)
    window.addEventListener('storage', onStorage)

    if ('BroadcastChannel' in window) {
      channel = new BroadcastChannel(AUTH_CHANNEL)
      channel.onmessage = (event) => finish(event.data)
    }

    pollTimer = setInterval(() => {
      const result = readResult()
      if (result) finish(result)
    }, 350)

    closeTimer = setInterval(() => {
      try {
        if (popup.closed && !readResult()) {
          fail(new Error('Вікно входу закрито до завершення авторизації.'))
        }
      } catch {
        // Поки popup на іншому домені, деякі браузери кидають SecurityError.
      }
    }, 500)

    timeoutTimer = setTimeout(() => {
      fail(new Error('Час очікування входу через Telegram вичерпано. Спробуй ще раз.'))
    }, AUTH_MAX_AGE_MS)
  })
}
