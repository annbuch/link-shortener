'use strict';

require('dotenv').config({ quiet: true });

const mongoose = require('mongoose');
const connectDB = require('../db');
const User = require('../models/User');
const Group = require('../models/Group');
const Link = require('../models/Link');

/** Детерминированный генератор псевдослучайных чисел — данные воспроизводимы. */
function mulberry32(seed) {
  let value = seed;
  return function random() {
    value |= 0;
    value = (value + 0x6d2b79f5) | 0;
    let t = Math.imul(value ^ (value >>> 15), 1 | value);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = mulberry32(20261109);
const pick = (items) => items[Math.floor(random() * items.length)];

const LOCATIONS = [
  { country: 'BY', city: 'Минск' },
  { country: 'BY', city: 'Гомель' },
  { country: 'RU', city: 'Москва' },
  { country: 'RU', city: 'Санкт-Петербург' },
  { country: 'DE', city: 'Берлин' },
  { country: 'US', city: 'Нью-Йорк' },
  { country: 'PL', city: 'Варшава' }
];

const DEVICES = ['desktop', 'desktop', 'desktop', 'mobile', 'mobile', 'tablet'];
const BROWSERS = {
  desktop: ['Chrome', 'Firefox', 'Edge', 'Safari'],
  mobile: ['Chrome', 'Safari', 'Opera', 'Firefox'],
  tablet: ['Safari', 'Chrome']
};
const OS_BY_DEVICE = {
  desktop: ['Windows', 'macOS', 'Linux'],
  mobile: ['Android', 'iOS'],
  tablet: ['iOS', 'Android']
};
const REFERERS = [
  'https://t.me/clickme',
  'https://www.google.com/',
  'https://www.instagram.com/',
  'https://habr.com/',
  'https://www.youtube.com/',
  'direct'
];

function makeClick(daysAgoMax = 30) {
  const device = pick(DEVICES);
  const createdAt = new Date(
    Date.now() - Math.floor(random() * daysAgoMax * 24 * 60 * 60 * 1000)
  );

  return {
    ip: `10.10.${Math.floor(random() * 255)}.${Math.floor(random() * 255)}`,
    userAgent: `Mozilla/5.0 (${pick(OS_BY_DEVICE[device])}) ${pick(BROWSERS[device])}`,
    referer: pick(REFERERS),
    location: pick(LOCATIONS),
    device,
    browser: pick(BROWSERS[device]),
    os: pick(OS_BY_DEVICE[device]),
    createdAt
  };
}

const LINKS = [
  {
    shortCode: 'promo',
    alias: 'spring-promo',
    originalUrl: 'https://example.com/campaigns/spring-sale',
    title: 'Весенняя промо-акция',
    tags: ['маркетинг', 'важный', 'акция'],
    utm: { source: 'telegram', medium: 'social', campaign: 'spring_sale' },
    group: 'marketing',
    clicks: 42
  },
  {
    shortCode: 'docs-mdn',
    alias: 'mdn',
    originalUrl: 'https://developer.mozilla.org/ru/docs/Web',
    title: 'MDN Web Docs',
    tags: ['документация', 'важный', 'frontend'],
    utm: { source: 'newsletter', medium: 'email', campaign: 'learning' },
    group: 'docs',
    clicks: 31
  },
  {
    shortCode: 'react-dev',
    alias: 'react',
    originalUrl: 'https://react.dev/learn',
    title: 'Документация React',
    tags: ['документация', 'frontend'],
    group: 'docs',
    clicks: 18
  },
  {
    shortCode: 'mongo-docs',
    alias: 'mongo',
    originalUrl: 'https://www.mongodb.com/docs/manual/',
    title: 'MongoDB Manual',
    tags: ['документация', 'nosql', 'важный'],
    group: 'docs',
    clicks: 25
  },
  {
    shortCode: 'pg-docs',
    alias: 'postgres',
    originalUrl: 'https://www.postgresql.org/docs/',
    title: 'PostgreSQL Documentation',
    tags: ['документация', 'sql'],
    group: 'docs',
    clicks: 12
  },
  {
    shortCode: 'figma-app',
    alias: 'figma',
    originalUrl: 'https://www.figma.com/files',
    title: 'Figma — макеты Click.me',
    tags: ['дизайн', 'работа'],
    group: 'work',
    clicks: 9
  },
  {
    shortCode: 'github-repo',
    alias: 'github',
    originalUrl: 'https://github.com/annbuch/link-shortener',
    title: 'Репозиторий Click.me',
    tags: ['работа', 'код', 'важный'],
    group: 'work',
    clicks: 14
  },
  {
    shortCode: 'youtube-ch',
    alias: 'youtube',
    originalUrl: 'https://www.youtube.com/',
    title: 'YouTube',
    tags: ['развлечения'],
    group: 'personal',
    clicks: 7
  },
  {
    shortCode: 'habr-news',
    alias: 'habr',
    originalUrl: 'https://habr.com/ru/',
    title: 'Хабр',
    tags: ['новости', 'развлечения'],
    group: 'personal',
    clicks: 5
  },
  {
    shortCode: 'limited-10',
    alias: 'limited',
    originalUrl: 'https://example.com/limited-offer',
    title: 'Ограниченное предложение (лимит 10 переходов)',
    tags: ['маркетинг', 'акция'],
    group: 'marketing',
    clicks: 10,
    maxClicks: 10,
    status: 'expired'
  }
];

async function seed() {
  await connectDB();

  console.log('Очистка коллекций users, groups, links...');
  await Promise.all([
    Link.deleteMany({}),
    Group.deleteMany({}),
    User.deleteMany({})
  ]);

  await Promise.all([User.syncIndexes(), Group.syncIndexes(), Link.syncIndexes()]);

  const owner = await User.create({
    email: process.env.DEMO_OWNER_EMAIL || 'demo@click.me',
    name: 'Аня',
    profile: { city: 'Минск', company: 'Click.me', timezone: 'Europe/Minsk' },
    settings: { language: 'ru', notifications: true, theme: 'dark' },
    lastLoginAt: new Date()
  });

  await User.create({
    email: 'bob@click.me',
    name: 'Боб',
    profile: { city: 'Москва', company: 'Click.me', timezone: 'Europe/Moscow' },
    settings: { language: 'ru', notifications: false, theme: 'light' }
  });

  const [marketing, docs, work, personal] = await Group.create([
    {
      name: 'Маркетинг',
      description: 'Рекламные кампании и промо-ссылки',
      color: '#8b5cf6',
      ownerId: owner._id
    },
    {
      name: 'Документация',
      description: 'Полезные материалы по стеку',
      color: '#22d3ee',
      ownerId: owner._id
    },
    {
      name: 'Работа',
      description: 'Рабочие сервисы и репозитории',
      color: '#34d399',
      ownerId: owner._id
    },
    {
      name: 'Личное',
      description: 'Ссылки для себя',
      color: '#f472b6',
      ownerId: owner._id
    }
  ]);

  const groupByKey = { marketing, docs, work, personal };

  for (const item of LINKS) {
    const link = new Link({
      originalUrl: item.originalUrl,
      shortCode: item.shortCode,
      alias: item.alias,
      title: item.title,
      tags: item.tags,
      status: item.status || 'active',
      ownerId: owner._id,
      groupId: groupByKey[item.group]._id,
      utm: item.utm || {},
      maxClicks: item.maxClicks || null,
      expiresAt: item.expiresAt || null
    });

    for (let index = 0; index < item.clicks; index += 1) {
      link.clicks.push(makeClick(30));
    }
    link.clickCount = link.clicks.length;

    await link.save();
  }

  const [users, groups, links, clicks] = await Promise.all([
    User.countDocuments(),
    Group.countDocuments(),
    Link.countDocuments(),
    Link.aggregate([
      { $project: { count: { $size: '$clicks' } } },
      { $group: { _id: null, total: { $sum: '$count' } } }
    ])
  ]);

  console.log('Готово. Демо-данные созданы:');
  console.log(`  пользователей: ${users}`);
  console.log(`  групп: ${groups}`);
  console.log(`  ссылок: ${links}`);
  console.log(`  вложенных кликов: ${clicks[0]?.total || 0}`);
  console.log(`  владелец: ${owner.email} (id ${owner._id})`);
  console.log('  короткие ссылки: promo, docs-mdn, react-dev, mongo-docs, pg-docs, ...');

  await mongoose.disconnect();
}

seed().catch(async (err) => {
  console.error('Ошибка seed:', err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
