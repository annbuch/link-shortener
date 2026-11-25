'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Link = require('../models/Link');
const Group = require('../models/Group');
const { generateShortCode, escapeRegex } = require('../utils/shortCode');
const { resolveOwnerId } = require('../utils/owner');
const { buildClick } = require('../utils/click');
const httpError = require('../utils/httpError');

const SORTS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  clicks: { clickCount: -1 },
  title: { title: 1 }
};

const ALLOWED_STATUSES = ['active', 'disabled', 'expired'];

function normalizeTags(tags) {
  if (tags === undefined || tags === null) return [];
  const list = Array.isArray(tags) ? tags : String(tags).split(',');
  return [...new Set(
    list.map((tag) => String(tag).trim().toLowerCase()).filter(Boolean)
  )];
}

function parseDate(value, fieldName = 'expiresAt') {
  if (value === null || value === undefined || value === '') return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw httpError(400, `${fieldName} должен быть корректной датой`);
  }
  return date;
}

async function resolveGroupId(groupId) {
  if (groupId === undefined || groupId === null || groupId === '') return null;
  if (!mongoose.isValidObjectId(groupId)) {
    throw httpError(400, 'groupId должен быть корректным ObjectId');
  }
  if (!(await Group.exists({ _id: groupId }))) {
    throw httpError(404, 'Группа не найдена');
  }
  return groupId;
}

async function assertCodeAvailable(code, excludeId = null) {
  const filter = { $or: [{ shortCode: code }, { alias: code }] };
  if (excludeId) filter._id = { $ne: excludeId };
  if (await Link.exists(filter)) {
    throw httpError(409, `Код "${code}" уже занят другой ссылкой`);
  }
}

async function uniqueShortCode() {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = generateShortCode();
    // eslint-disable-next-line no-await-in-loop
    if (!(await Link.exists({ $or: [{ shortCode: code }, { alias: code }] }))) {
      return code;
    }
  }
  throw httpError(500, 'Не удалось сгенерировать уникальный короткий код');
}

function buildFilter(query) {
  const filter = {};

  if (query.ownerId) {
    if (!mongoose.isValidObjectId(query.ownerId)) {
      throw httpError(400, 'ownerId должен быть корректным ObjectId');
    }
    filter.ownerId = query.ownerId;
  }

  if (query.groupId) {
    if (!mongoose.isValidObjectId(query.groupId)) {
      throw httpError(400, 'groupId должен быть корректным ObjectId');
    }
    filter.groupId = query.groupId;
  }

  if (query.status) {
    if (!ALLOWED_STATUSES.includes(query.status)) {
      throw httpError(400, `status должен быть одним из: ${ALLOWED_STATUSES.join(', ')}`);
    }
    filter.status = query.status;
  }

  // Поиск по массиву: tags содержит значение
  if (query.tag) {
    filter.tags = String(query.tag).toLowerCase();
  }

  if (query.search) {
    const regex = new RegExp(escapeRegex(query.search), 'i');
    filter.$or = [
      { originalUrl: regex },
      { title: regex },
      { alias: regex },
      { shortCode: regex },
      { tags: regex }
    ];
  }

  return filter;
}

/** GET /api/links — список с фильтрами, пагинацией и сортировкой. */
exports.listLinks = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const sort = SORTS[req.query.sort] || SORTS.newest;
  const filter = buildFilter(req.query);

  const [items, total] = await Promise.all([
    Link.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('ownerId', 'email name profile')
      .populate('groupId', 'name color'),
    Link.countDocuments(filter)
  ]);

  res.json({
    items,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit))
  });
};

/** GET /api/links/:id — одна ссылка с populate связанных коллекций. */
exports.getLink = async (req, res) => {
  const link = await Link.findById(req.params.id)
    .select('+passwordHash')
    .populate('ownerId', 'email name profile')
    .populate('groupId', 'name description color');

  if (!link) throw httpError(404, 'Ссылка не найдена');
  res.json(link);
};

/** POST /api/links — создание документа. */
exports.createLink = async (req, res) => {
  const body = req.body || {};
  const ownerId = await resolveOwnerId(body.ownerId);
  const groupId = await resolveGroupId(body.groupId);

  const shortCode = body.shortCode
    ? String(body.shortCode).trim().toLowerCase()
    : await uniqueShortCode();
  await assertCodeAvailable(shortCode);

  let alias;
  if (body.alias) {
    alias = String(body.alias).trim().toLowerCase();
    await assertCodeAvailable(alias);
  }

  const link = new Link({
    originalUrl: body.originalUrl,
    shortCode,
    alias,
    title: body.title,
    tags: normalizeTags(body.tags),
    status: body.status || 'active',
    ownerId,
    groupId,
    utm: body.utm,
    expiresAt: parseDate(body.expiresAt),
    maxClicks: body.maxClicks ?? null
  });

  if (body.password) {
    link.passwordHash = await bcrypt.hash(String(body.password), 10);
  }

  await link.save();
  res.status(201).json(link);
};

/** PUT/PATCH /api/links/:id — обновление. */
exports.updateLink = async (req, res) => {
  const body = req.body || {};
  const set = {};
  const unset = {};

  if (body.originalUrl !== undefined) set.originalUrl = body.originalUrl;
  if (body.title !== undefined) set.title = body.title;
  if (body.status !== undefined) set.status = body.status;
  if (body.utm !== undefined) set.utm = body.utm;
  if (body.maxClicks !== undefined) {
    set.maxClicks = body.maxClicks === null || body.maxClicks === '' ? null : body.maxClicks;
  }
  if (body.expiresAt !== undefined) set.expiresAt = parseDate(body.expiresAt);
  if (body.tags !== undefined) set.tags = normalizeTags(body.tags);

  if (body.groupId !== undefined) {
    set.groupId = await resolveGroupId(body.groupId);
  }

  if (body.shortCode !== undefined) {
    const shortCode = String(body.shortCode).trim().toLowerCase();
    if (!shortCode) throw httpError(400, 'shortCode не может быть пустым');
    await assertCodeAvailable(shortCode, req.params.id);
    set.shortCode = shortCode;
  }

  if (body.alias !== undefined) {
    if (body.alias) {
      const alias = String(body.alias).trim().toLowerCase();
      await assertCodeAvailable(alias, req.params.id);
      set.alias = alias;
    } else {
      // sparse-индекс: пустой alias нужно именно удалить из документа
      unset.alias = '';
    }
  }

  if (body.password !== undefined) {
    set.passwordHash = body.password
      ? await bcrypt.hash(String(body.password), 10)
      : null;
  }

  if (Object.keys(set).length === 0 && Object.keys(unset).length === 0) {
    throw httpError(400, 'Нет полей для обновления');
  }

  const update = {};
  if (Object.keys(set).length) update.$set = set;
  if (Object.keys(unset).length) update.$unset = unset;

  const link = await Link.findByIdAndUpdate(req.params.id, update, {
    returnDocument: 'after',
    runValidators: true
  })
    .populate('ownerId', 'email name profile')
    .populate('groupId', 'name color');

  if (!link) throw httpError(404, 'Ссылка не найдена');
  res.json(link);
};

/** DELETE /api/links/:id — возвращает удалённый документ. */
exports.deleteLink = async (req, res) => {
  const link = await Link.findByIdAndDelete(req.params.id);
  if (!link) throw httpError(404, 'Ссылка не найдена');

  res.json({
    message: 'Ссылка удалена',
    deleted: link
  });
};

/** POST /api/links/:id/clicks — добавление вложенного документа клика. */
exports.addClick = async (req, res) => {
  const link = await Link.findById(req.params.id);
  if (!link) throw httpError(404, 'Ссылка не найдена');

  const availability = link.checkAvailability();
  if (!availability.ok) throw httpError(availability.status, availability.message);

  link.clicks.push(buildClick(req, req.body));
  link.clickCount = link.clicks.length;
  if (link.maxClicks && link.clickCount >= link.maxClicks) {
    link.status = 'expired';
  }

  await link.save();

  res.status(201).json({
    message: 'Клик добавлен во вложенный массив',
    click: link.clicks[link.clicks.length - 1],
    clickCount: link.clickCount
  });
};

/** PATCH /api/links/:id/clicks/:clickId — обновление элемента массива ($). */
exports.updateClick = async (req, res) => {
  const { id, clickId } = req.params;
  if (!mongoose.isValidObjectId(clickId)) {
    throw httpError(400, 'clickId должен быть корректным ObjectId');
  }

  const allowed = ['ip', 'userAgent', 'referer', 'device', 'browser', 'os', 'location', 'createdAt'];
  const set = {};

  for (const field of allowed) {
    if (req.body[field] !== undefined) {
      set[`clicks.$.${field}`] =
        field === 'createdAt' ? parseDate(req.body[field], 'createdAt') : req.body[field];
    }
  }

  if (Object.keys(set).length === 0) {
    throw httpError(400, 'Нет полей клика для обновления');
  }

  // Позиционный оператор $ меняет именно найденный элемент массива
  const link = await Link.findOneAndUpdate(
    { _id: id, 'clicks._id': clickId },
    { $set: set },
    { returnDocument: 'after', runValidators: true }
  );

  if (!link) throw httpError(404, 'Ссылка или клик не найдены');

  res.json({
    message: 'Клик обновлён позиционным оператором $',
    click: link.clicks.id(clickId),
    clickCount: link.clickCount
  });
};

/** DELETE /api/links/:id/clicks/:clickId — $pull элемента массива. */
exports.deleteClick = async (req, res) => {
  const { id, clickId } = req.params;
  if (!mongoose.isValidObjectId(clickId)) {
    throw httpError(400, 'clickId должен быть корректным ObjectId');
  }

  const link = await Link.findById(id);
  if (!link) throw httpError(404, 'Ссылка не найдена');

  const click = link.clicks.id(clickId);
  if (!click) throw httpError(404, 'Клик не найден');

  link.clicks.pull(clickId);
  link.clickCount = link.clicks.length;
  if (link.maxClicks && link.clickCount < link.maxClicks && link.status === 'expired') {
    link.status = 'active';
  }
  await link.save();

  res.json({
    message: 'Клик удалён из вложенного массива',
    clickCount: link.clickCount
  });
};

/** POST /api/links/:id/tags — $addToSet (без дубликатов). */
exports.addTag = async (req, res) => {
  const tag = String(req.body.tag || '').trim().toLowerCase();
  if (!tag) throw httpError(400, 'tag обязателен');

  const link = await Link.findByIdAndUpdate(
    req.params.id,
    { $addToSet: { tags: tag } },
    { returnDocument: 'after', runValidators: true }
  );

  if (!link) throw httpError(404, 'Ссылка не найдена');
  res.json({ message: 'Тег добавлен', tags: link.tags });
};

/** DELETE /api/links/:id/tags/:tag — $pull из массива тегов. */
exports.removeTag = async (req, res) => {
  const tag = String(req.params.tag || '').trim().toLowerCase();

  const link = await Link.findByIdAndUpdate(
    req.params.id,
    { $pull: { tags: tag } },
    { returnDocument: 'after' }
  );

  if (!link) throw httpError(404, 'Ссылка не найдена');
  res.json({ message: 'Тег удалён', tags: link.tags });
};

/** GET /api/links/:id/stats — aggregation pipeline по вложенным кликам. */
exports.getLinkStats = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw httpError(400, 'id должен быть корректным ObjectId');
  }

  const objectId = new mongoose.Types.ObjectId(req.params.id);

  const [link, aggregation] = await Promise.all([
    Link.findById(objectId).select('shortCode alias title clickCount tags status'),
    Link.aggregate([
      { $match: { _id: objectId } },
      { $unwind: { path: '$clicks', preserveNullAndEmptyArrays: true } },
      {
        $facet: {
          total: [
            { $match: { 'clicks._id': { $exists: true } } },
            { $count: 'count' }
          ],
          byCountry: [
            { $match: { 'clicks.location.country': { $exists: true } } },
            { $group: { _id: '$clicks.location.country', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ],
          byCity: [
            { $match: { 'clicks.location.city': { $exists: true } } },
            {
              $group: {
                _id: { country: '$clicks.location.country', city: '$clicks.location.city' },
                count: { $sum: 1 }
              }
            },
            { $sort: { count: -1 } }
          ],
          byDevice: [
            { $match: { 'clicks.device': { $exists: true } } },
            { $group: { _id: '$clicks.device', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ],
          byBrowser: [
            { $match: { 'clicks.browser': { $exists: true } } },
            { $group: { _id: '$clicks.browser', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ],
          daily: [
            { $match: { 'clicks.createdAt': { $exists: true } } },
            {
              $group: {
                _id: {
                  $dateToString: { format: '%Y-%m-%d', date: '$clicks.createdAt' }
                },
                count: { $sum: 1 }
              }
            },
            { $sort: { _id: 1 } }
          ],
          byReferer: [
            { $match: { 'clicks.referer': { $exists: true } } },
            { $group: { _id: '$clicks.referer', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
          ]
        }
      }
    ])
  ]);

  if (!link) throw httpError(404, 'Ссылка не найдена');

  const stats = aggregation[0] || {};
  res.json({
    link,
    totalClicks: stats.total?.[0]?.count || 0,
    byCountry: stats.byCountry || [],
    byCity: stats.byCity || [],
    byDevice: stats.byDevice || [],
    byBrowser: stats.byBrowser || [],
    daily: stats.daily || [],
    byReferer: stats.byReferer || []
  });
};

/** GET /api/links/stats/overview — сводка по всем ссылкам (aggregation). */
exports.getOverview = async (req, res) => {
  const [overview, topTags] = await Promise.all([
    Link.aggregate([
      {
        $group: {
          _id: null,
          links: { $sum: 1 },
          clicks: { $sum: '$clickCount' },
          avgClicks: { $avg: '$clickCount' }
        }
      },
      {
        $project: {
          _id: 0,
          links: 1,
          clicks: 1,
          avgClicks: { $round: ['$avgClicks', 2] }
        }
      }
    ]),
    Link.aggregate([
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ])
  ]);

  res.json({
    overview: overview[0] || { links: 0, clicks: 0, avgClicks: 0 },
    topTags
  });
};
