# Що виправлено

1. У production запити до FastAPI йдуть через same-origin шлях `/backend/*`.
   Vercel проксіює їх на Railway, тому CORS та preview-домени Vercel більше не ламають авторизацію.
2. Telegram Mini App initData читається не лише з SDK, а й з `tgWebAppData` у URL hash/query.
3. Фронтенд чекає до 1.8 секунди на ініціалізацію Telegram SDK і не відкриває popup у Mini App.
4. Якщо Telegram відкрив сайт як звичайне посилання, показується точна підказка замість popup.
5. Помилка мережі тепер показує URL запиту та справжню причину.

## Vercel
Залишити:
- VITE_TG_CLIENT_ID=8624605092
- VITE_TG_REDIRECT_URI=https://wishlle-4isp.vercel.app/auth/callback
- VITE_DIRECTUS_URL=https://directus-production-5c4b.up.railway.app

VITE_BACKEND_URL може залишатися, але в production фронтенд навмисно використовує `/backend`.
