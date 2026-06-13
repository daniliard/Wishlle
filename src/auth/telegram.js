// Допоміжні функції для Telegram Mini App.
// SDK зазвичай заповнює window.Telegram.WebApp.initData сам.
// Додатково читаємо tgWebAppData з hash/query як fallback, щоб не звалюватися
// у браузерний popup, якщо SDK завантажився із затримкою.

function readLaunchParams() {
  const result = new URLSearchParams()

  const append = (raw) => {
    if (!raw) return
    const normalized = raw.replace(/^[?#]/, '')
    const params = new URLSearchParams(normalized)
    for (const [key, value] of params.entries()) {
      if (!result.has(key)) result.set(key, value)
    }
  }

  append(window.location.hash)
  append(window.location.search)
  return result
}

export function getTelegramInitData() {
  const sdkInitData = window.Telegram?.WebApp?.initData
  if (typeof sdkInitData === 'string' && sdkInitData.length > 0) {
    return sdkInitData
  }

  const fallback = readLaunchParams().get('tgWebAppData')
  return typeof fallback === 'string' ? fallback : ''
}

export function isTelegramMiniApp() {
  return getTelegramInitData().length > 0
}

export function looksLikeTelegramLaunch() {
  const params = readLaunchParams()
  return Boolean(
    params.get('tgWebAppVersion') ||
    params.get('tgWebAppPlatform') ||
    params.get('tgWebAppData') ||
    window.TelegramWebviewProxy ||
    window.Telegram?.WebApp?.platform && window.Telegram.WebApp.platform !== 'unknown'
  )
}

export async function waitForTelegramInitData(timeoutMs = 1800) {
  const startedAt = Date.now()

  while (Date.now() - startedAt < timeoutMs) {
    const initData = getTelegramInitData()
    if (initData) return initData
    await new Promise((resolve) => setTimeout(resolve, 60))
  }

  return getTelegramInitData()
}

export function telegramReady() {
  const webApp = window.Telegram?.WebApp
  if (!webApp) return

  try {
    webApp.ready()
    webApp.expand()
  } catch (error) {
    console.warn('Telegram WebApp initialization warning:', error)
  }
}
