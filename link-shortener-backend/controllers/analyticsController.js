const { Link, Click } = require('../models');
const { Op } = require('sequelize');

// GET /links/:id/analytics
/**
 * @openapi
 * /links/{id}/analytics:
 *   get:
 *     summary: Получить полную аналитику по ссылке
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID ссылки
 *     responses:
 *       200:
 *         description: Детальная статистика
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AnalyticsSummary'
 *       404:
 *         description: Ссылка не найдена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Требуется авторизация
 */
exports.getAnalytics = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const link = await Link.findOne({ where: { id, userId: req.user.id, deletedAt: null } });
    if (!link) {
      return res.status(404).json({ error: 'Ссылка не найдена' });
    }
    const clicks = await Click.findAll({ where: { linkId: id } });

    const total = clicks.length;
    const uniqueIPs = new Set(clicks.map(c => c.ip)).size;

    const daily = {};
    const geo = {};
    const devices = {};
    const referrers = {};
    clicks.forEach(c => {
      const date = new Date(c.timestamp).toISOString().split('T')[0];
      daily[date] = (daily[date] || 0) + 1;

      const country = c.location?.country || 'Unknown';
      geo[country] = (geo[country] || 0) + 1;

      const ua = c.userAgent || '';
      let type = 'Other';
      if (/mobile/i.test(ua)) type = 'Mobile';
      else if (/tablet/i.test(ua)) type = 'Tablet';
      else if (/windows|mac|linux/i.test(ua)) type = 'Desktop';
      devices[type] = (devices[type] || 0) + 1;

      const ref = c.referer || 'direct';
      referrers[ref] = (referrers[ref] || 0) + 1;
    });

    res.json({
      link: link.shortCode,
      totalClicks: total,
      uniqueVisitors: uniqueIPs,
      daily,
      geo,
      devices,
      referrers
    });
  } catch (err) {
    next(err);
  }
};

// GET /links/:id/analytics/clicks
/**
 * @openapi
 * /links/{id}/analytics/clicks:
 *   get:
 *     summary: Получить список всех переходов с пагинацией
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Начальная дата (YYYY-MM-DD)
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: Конечная дата (YYYY-MM-DD)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Список переходов
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ClicksListResponse'
 *       404:
 *         description: Ссылка не найдена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Требуется авторизация
 */
exports.getClicksList = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const link = await Link.findOne({ where: { id, userId: req.user.id, deletedAt: null } });
    if (!link) {
      return res.status(404).json({ error: 'Ссылка не найдена' });
    }
    const { from, to, page = 1, limit = 20 } = req.query;
    const where = { linkId: id };
    if (from) where.timestamp = { ...(where.timestamp || {}), [Op.gte]: new Date(from).getTime() };
    if (to) where.timestamp = { ...(where.timestamp || {}), [Op.lte]: new Date(to).getTime() };

    const { count, rows } = await Click.findAndCountAll({
      where,
      limit: Number(limit),
      offset: (Number(page) - 1) * Number(limit),
      order: [['timestamp', 'DESC']]
    });
    res.json({
      data: rows,
      total: count,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(count / limit)
    });
  } catch (err) {
    next(err);
  }
};

// GET /links/:id/analytics/daily
/**
 * @openapi
 * /links/{id}/analytics/daily:
 *   get:
 *     summary: Статистика по дням
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Объект с количеством переходов по дням
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties:
 *                 type: integer
 *               example:
 *                 '2024-01-01': 10
 *                 '2024-01-02': 15
 *       404:
 *         description: Ссылка не найдена
 *       401:
 *         description: Требуется авторизация
 */
exports.getDaily = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const link = await Link.findOne({ where: { id, userId: req.user.id, deletedAt: null } });
    if (!link) {
      return res.status(404).json({ error: 'Ссылка не найдена' });
    }
    const clicks = await Click.findAll({ where: { linkId: id } });
    const daily = {};
    clicks.forEach(c => {
      const date = new Date(c.timestamp).toISOString().split('T')[0];
      daily[date] = (daily[date] || 0) + 1;
    });
    res.json(daily);
  } catch (err) {
    next(err);
  }
};

// GET /links/:id/analytics/geolocation
/**
 * @openapi
 * /links/{id}/analytics/geolocation:
 *   get:
 *     summary: Географическое распределение переходов
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Количество переходов по странам
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties:
 *                 type: integer
 *               example:
 *                 BY: 30
 *                 RU: 25
 *                 US: 20
 *       404:
 *         description: Ссылка не найдена
 *       401:
 *         description: Требуется авторизация
 */
exports.getGeo = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const link = await Link.findOne({ where: { id, userId: req.user.id, deletedAt: null } });
    if (!link) {
      return res.status(404).json({ error: 'Ссылка не найдена' });
    }
    const clicks = await Click.findAll({ where: { linkId: id } });
    const geo = {};
    clicks.forEach(c => {
      const country = c.location?.country || 'Unknown';
      geo[country] = (geo[country] || 0) + 1;
    });
    res.json(geo);
  } catch (err) {
    next(err);
  }
};

// GET /links/:id/analytics/devices
/**
 * @openapi
 * /links/{id}/analytics/devices:
 *   get:
 *     summary: Распределение по устройствам
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Количество переходов по типам устройств
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties:
 *                 type: integer
 *               example:
 *                 Desktop: 40
 *                 Mobile: 50
 *                 Tablet: 10
 *       404:
 *         description: Ссылка не найдена
 *       401:
 *         description: Требуется авторизация
 */
exports.getDevices = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const link = await Link.findOne({ where: { id, userId: req.user.id, deletedAt: null } });
    if (!link) {
      return res.status(404).json({ error: 'Ссылка не найдена' });
    }
    const clicks = await Click.findAll({ where: { linkId: id } });
    const devices = {};
    clicks.forEach(c => {
      const ua = c.userAgent || '';
      let type = 'Other';
      if (/mobile/i.test(ua)) type = 'Mobile';
      else if (/tablet/i.test(ua)) type = 'Tablet';
      else if (/windows|mac|linux/i.test(ua)) type = 'Desktop';
      devices[type] = (devices[type] || 0) + 1;
    });
    res.json(devices);
  } catch (err) {
    next(err);
  }
};

// GET /links/:id/analytics/referrers
/**
 * @openapi
 * /links/{id}/analytics/referrers:
 *   get:
 *     summary: Топ источников трафика
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Количество переходов по источникам
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties:
 *                 type: integer
 *               example:
 *                 direct: 30
 *                 google.com: 25
 *                 facebook.com: 20
 *       404:
 *         description: Ссылка не найдена
 *       401:
 *         description: Требуется авторизация
 */
exports.getReferrers = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const link = await Link.findOne({ where: { id, userId: req.user.id, deletedAt: null } });
    if (!link) {
      return res.status(404).json({ error: 'Ссылка не найдена' });
    }
    const clicks = await Click.findAll({ where: { linkId: id } });
    const refs = {};
    clicks.forEach(c => {
      const ref = c.referer || 'direct';
      refs[ref] = (refs[ref] || 0) + 1;
    });
    res.json(refs);
  } catch (err) {
    next(err);
  }
};

// GET /analytics/overview
/**
 * @openapi
 * /analytics/overview:
 *   get:
 *     summary: Общая статистика по всем ссылкам пользователя
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Сводная статистика
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OverviewStats'
 *       401:
 *         description: Требуется авторизация
 */
exports.getOverview = async (req, res, next) => {
  try {
    const links = await Link.findAll({ where: { userId: req.user.id, deletedAt: null } });
    let totalClicks = 0;
    let activeLinks = 0;
    let mostPopular = null;
    for (const link of links) {
      totalClicks += link.clicks;
      if (link.isActive) activeLinks++;
      if (!mostPopular || link.clicks > mostPopular.clicks) {
        mostPopular = link;
      }
    }
    res.json({
      totalLinks: links.length,
      activeLinks,
      totalClicks,
      mostPopular: mostPopular ? { shortCode: mostPopular.shortCode, clicks: mostPopular.clicks } : null
    });
  } catch (err) {
    next(err);
  }
};

// GET /links/:id/export/csv (заглушка)
/**
 * @openapi
 * /links/{id}/export/csv:
 *   get:
 *     summary: Экспорт статистики в CSV
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: CSV-файл будет сгенерирован
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: CSV будет сгенерирован
 *       404:
 *         description: Ссылка не найдена
 *       401:
 *         description: Требуется авторизация
 */
exports.exportCSV = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const link = await Link.findOne({ where: { id, userId: req.user.id, deletedAt: null } });
    if (!link) {
      return res.status(404).json({ error: 'Ссылка не найдена' });
    }
    res.json({ message: 'CSV будет сгенерирован' });
  } catch (err) {
    next(err);
  }
};

// GET /links/:id/export/pdf (заглушка)
/**
 * @openapi
 * /links/{id}/export/pdf:
 *   get:
 *     summary: Экспорт статистики в PDF
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: PDF-отчёт будет сгенерирован
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: PDF будет сгенерирован
 *       404:
 *         description: Ссылка не найдена
 *       401:
 *         description: Требуется авторизация
 */
exports.exportPDF = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const link = await Link.findOne({ where: { id, userId: req.user.id, deletedAt: null } });
    if (!link) {
      return res.status(404).json({ error: 'Ссылка не найдена' });
    }
    res.json({ message: 'PDF будет сгенерирован' });
  } catch (err) {
    next(err);
  }
};