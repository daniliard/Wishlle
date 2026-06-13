# Google authentication — налаштування Wishlle

## 1. Google Cloud

Створи OAuth 2.0 Client ID типу **Web application** у Google Auth Platform / Google Cloud Console.

Authorized JavaScript origins:

```text
https://wishlle-4isp.vercel.app
http://localhost:5173
```

Для цієї реалізації використовується Google Identity Services у режимі `popup` з JavaScript callback, тому Authorized redirect URI не потрібен.

Якщо застосунок у режимі Testing, додай свій Google-акаунт у Test users.

## 2. Vercel

Додай змінну для Production, Preview та Development:

```env
VITE_GOOGLE_CLIENT_ID=ТВІЙ_CLIENT_ID.apps.googleusercontent.com
```

Після зміни зроби новий Redeploy.

## 3. Railway — Wishlle_backend

Додай той самий Client ID:

```env
GOOGLE_CLIENT_ID=ТВІЙ_CLIENT_ID.apps.googleusercontent.com
```

Google Client Secret у цій схемі не потрібен: фронтенд отримує ID token, а FastAPI перевіряє його підпис, audience, issuer та строк дії.

## 4. Directus — колекція users

Переконайся, що є поля:

- `google_sub` — string, nullable, unique;
- `auth_provider` — string, nullable;
- `display_name` — string;
- `avatar_url` — string.

`google_sub` є стабільним зовнішнім ID Google-користувача. Пароль у Wishlle не зберігається.

## 5. Деплой

Онови обидва репозиторії та зроби redeploy фронтенду й бекенду.
