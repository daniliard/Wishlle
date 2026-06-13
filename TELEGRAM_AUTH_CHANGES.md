# Що виправлено

- Mini App автоматично відправляє `Telegram.WebApp.initData` на `/api/auth/telegram` і не відкриває жодних сторонніх вікон.
- У браузері popup відкривається синхронно під час кліку, тому Chrome не встигає заблокувати його.
- Реалізовано Authorization Code Flow + PKCE та перевірку `state`.
- Callback передає результат у головне вікно через `postMessage`, `BroadcastChannel` та `localStorage` fallback.
- Прибрано помилкове припущення, що `sessionStorage` спільний між popup і головним вікном.
- Додано відновлення входу, якщо браузер відкрив callback у звичайній вкладці.
- URL, Client ID і backend винесено у Vite environment variables.
- `postMessage` обмежено поточним origin замість небезпечного `*`.
- Збережено Vercel COOP-заголовок `same-origin-allow-popups`.

## Важливо

У початковому backend-архіві OIDC перевірявся через неправильні значення:

- JWKS: `https://oauth.telegram.org/jwks`;
- issuer: `https://telegram.org`;
- audience не перевірявся.

Для браузерного входу потрібен виправлений backend із другого архіву, який додається разом із frontend.
