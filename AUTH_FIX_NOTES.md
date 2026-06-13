# Telegram auth fixes

1. `request()` більше не перезавантажує сторінку на будь-якому `401`. Помилка від backend тепер показується користувачу.
2. OAuth callback розпізнається не лише за `/auth/callback`, а й за параметрами `?code=` або `?error=`. Це не дає popup показувати копію лендингу, якщо Telegram повернув код на корінь домену.
3. Для production все одно використовуйте точний callback: `https://wishlle-4isp.vercel.app/auth/callback`.
