# Wishlle App 🎁

Повноцінний адаптивний веб-застосунок для вішлістів на React + Vite.

## Запуск

```bash
npm install
npm run dev
```

Відкриється на **http://localhost:5173**

## Адаптивність

| Пристрій | Поведінка |
|----------|-----------|
| Desktop (> 768px) | Топ-навігація з усіма розділами |
| Mobile (≤ 768px) | Фіксована нижня навігація (Bottom Nav) |

## Сторінки

| Сторінка | Файл |
|----------|------|
| Головна | `src/pages/Home.jsx` |
| Мої списки | `src/pages/Lists.jsx` |
| Друзі | `src/pages/Friends.jsx` |
| Події | `src/pages/Events.jsx` |
| Каталог | `src/pages/Catalog.jsx` |
| Акаунт | `src/pages/Account.jsx` |

## Компоненти

- `Navbar` — фіксована верхня навігація (десктоп)
- `BottomNav` — нижня навігація (тільки мобайл, `display:none` на десктопі)
- `Footer` — футер

## Структура

```
src/
├── App.jsx
├── main.jsx
├── styles/global.css
├── components/
│   ├── Navbar.jsx + Navbar.module.css
│   ├── BottomNav.jsx + BottomNav.module.css
│   └── Footer.jsx
└── pages/
    ├── Home.jsx + Home.module.css
    ├── Lists.jsx + Lists.module.css
    ├── Friends.jsx
    ├── Events.jsx
    ├── Catalog.jsx
    └── Account.jsx
```
