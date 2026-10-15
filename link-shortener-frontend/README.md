# Click.me — frontend (лабораторная 4)

Клиентская часть сервиса сокращения ссылок **Click.me**. React + Vite.

Лабораторная 4 — управление локальным состоянием (`useState`, `useEffect`).
Приложение автономно и хранит данные в `localStorage` (в лабораторной 5
хранилище будет заменено на REST API бэкенда).

## Функциональность

- Список коротких ссылок: добавление, редактирование, удаление, вкл/выкл активности, счётчик кликов.
- Поля ссылки: метка, оригинальный URL, алиас, короткий код, клики, статус, дата создания.
- Поиск (метка/URL/алиас), фильтр по статусу, сортировка (дата/клики/алфавит).
- `useEffect [links]` — сохранение в `localStorage`; загрузка при монтировании (ленивый инициализатор).
- Доп. эффекты: заголовок страницы, автосохранение с debounce (500 мс), имитация загрузки (1 с), статистика.
- Пользовательские хуки: `useLocalStorage`, `useDebounce`.

## Запуск

```bash
npm install
npm run dev      # режим разработки (http://localhost:5173)
npm run build    # production-сборка
npm run preview  # предпросмотр сборки
```

## Структура

```
src/
├── main.jsx, App.jsx, App.css, index.css
├── hooks/        useLocalStorage.js, useDebounce.js
├── components/   LinkForm, LinkFilters, Stats, LinkList, LinkItem
├── data/         seedLinks.js
└── utils/        shortCode.js
```
