// Визначення середовища Telegram Mini App

export function isTelegramMiniApp() {
  // Найнадійніша ознака — наявність непорожнього initData від WebApp SDK
  const tg = window.Telegram?.WebApp
  if (!tg) return false
  // initData є тільки коли реально відкрито через Telegram
  return typeof tg.initData === 'string' && tg.initData.length > 0
}

export function getTelegramInitData() {
  return window.Telegram?.WebApp?.initData || null
}

export function telegramReady() {
  const tg = window.Telegram?.WebApp
  if (tg) {
    try { tg.ready(); tg.expand() } catch {}
  }
}
