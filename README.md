# Wishlle Frontend — Telegram authorization

React + Vite frontend з двома окремими сценаріями входу:

1. **Telegram Mini App** — автоматичний вхід через `Telegram.WebApp.initData`, без popup і без redirect.
2. **Звичайний браузер** — OAuth/OIDC Authorization Code Flow з PKCE у popup-вікні. Після підтвердження в Telegram popup закривається, а сайт одразу відкриває головну сторінку.

## Локальний запуск

```bash
npm install
cp .env.example .env
npm run dev
```

Для локального тесту браузерного входу додай у BotFather окремі URL:

- Redirect URI: `http://localhost:5173/auth/callback`
- Trusted Origin: `http://localhost:5173`

і тимчасово задай у `.env`:

```env
VITE_TG_REDIRECT_URI=http://localhost:5173/auth/callback
```

## Налаштування Vercel

У **Project → Settings → Environment Variables** додай:

```env
VITE_BACKEND_URL=https://wishllebackend-production.up.railway.app
VITE_DIRECTUS_URL=https://directus-production-5c4b.up.railway.app
VITE_TG_CLIENT_ID=8624605092
VITE_TG_REDIRECT_URI=https://wishlle-4isp.vercel.app/auth/callback
```

Після зміни змінних зроби новий deployment.

`vercel.json` уже містить:

- SPA rewrite на `index.html`;
- `Cross-Origin-Opener-Policy: same-origin-allow-popups`, потрібний для зв'язку з Telegram popup.

## Налаштування BotFather

У **Bot Settings → Web Login** повинні бути окремо додані:

- **Redirect URI:** `https://wishlle-4isp.vercel.app/auth/callback`
- **Trusted Origin:** `https://wishlle-4isp.vercel.app`

Важливо: URL має збігатися символ у символ. Redirect URI `/` зі скріншота недостатньо, якщо код використовує `/auth/callback`.

## Налаштування Railway backend

```env
TELEGRAM_CLIENT_ID=8624605092
TELEGRAM_CLIENT_SECRET=<секрет із BotFather>
TELEGRAM_REDIRECT_URI=https://wishlle-4isp.vercel.app/auth/callback
CORS_ORIGINS=["http://localhost:5173","https://wishlle-4isp.vercel.app"]
```

Client Secret ніколи не додавай у Vite/Vercel frontend-змінні — він має бути тільки на Railway.

## Основні файли авторизації

- `src/auth/telegram.js` — визначення Mini App і читання `initData`;
- `src/auth/browserTelegram.js` — popup, PKCE, state, обмін коду через backend;
- `src/pages/AuthCallback.jsx` — сторінка повернення з Telegram;
- `src/App.jsx` — автоматичний Mini App login та відновлення browser login;
- `src/pages/LandingPage.jsx` — кнопка входу в браузері.

## Перевірка

```bash
npm run build
```

Після деплою перевір два сценарії:

1. Відкрити Mini App кнопкою бота — головна сторінка повинна з'явитися без додаткового входу.
2. Відкрити Vercel URL у Chrome — натиснути «Увійти через Telegram», підтвердити в popup, після чого popup закриється і відкриється головна сторінка.

## Google authentication

У цій версії додано Google Identity Services у режимі popup. Після отримання Google ID token фронтенд надсилає його на `POST /backend/api/auth/google`, а бекенд створює або завантажує користувача через поле `google_sub`.

Детальне налаштування: `GOOGLE_AUTH_SETUP.md`.
