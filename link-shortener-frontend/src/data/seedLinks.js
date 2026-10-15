// Начальные демо-данные (используются при первом запуске, когда localStorage пуст).
// Предметная область — сервис сокращения ссылок Click.me.
const DAY = 24 * 60 * 60 * 1000
const now = Date.now()

export const seedLinks = [
  {
    id: 'seed-1',
    label: 'Документация React',
    originalUrl: 'https://react.dev/learn',
    shortCode: 'rcta1b',
    alias: 'react-docs',
    clicks: 128,
    isActive: true,
    createdAt: now - 9 * DAY,
  },
  {
    id: 'seed-2',
    label: 'Промо-лендинг',
    originalUrl: 'https://example.com/spring-sale?utm_source=newsletter',
    shortCode: 'sale22',
    alias: 'spring-sale',
    clicks: 42,
    isActive: true,
    createdAt: now - 4 * DAY,
  },
  {
    id: 'seed-3',
    label: 'Запись вебинара',
    originalUrl: 'https://youtube.com/watch?v=abcd1234',
    shortCode: 'web1n7',
    alias: 'webinar',
    clicks: 7,
    isActive: false,
    createdAt: now - 1 * DAY,
  },
]
