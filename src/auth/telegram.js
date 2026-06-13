// Допоміжні функції для Telegram Mini App.

export function isTelegramMiniApp() {
  const webApp = window.Telegram?.WebApp
  return Boolean(webApp && typeof webApp.initData === 'string' && webApp.initData.length > 0)
}

export function getTelegramInitData() {
  return window.Telegram?.WebApp?.initData || ''
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
