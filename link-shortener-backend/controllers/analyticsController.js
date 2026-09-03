const linkModel = require('../models/linkModel');
const clickModel = require('../models/clickModel');

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
exports.getAnalytics = (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const link = linkModel.getById(id, req.user.id);
    if (!link) {
      return res.status(404).json({ error: 'Ссылка не найдена' });
    }
    const stats = clickModel.getStats(id);
    const daily = clickModel.getDailyStats(id);
    const geo = clickModel.getGeoStats(id);
    const devices = clickModel.getDeviceStats(id);
    const referrers = clickModel.getReferrerStats(id);
    res.json({
      link: link.shortCode,
      totalClicks: stats.total,
      uniqueVisitors: stats.uniqueIPs,
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
exports.getClicksList = (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const link = linkModel.getById(id, req.user.id);
    if (!link) {
      return res.status(404).json({ error: 'Ссылка не найдена' });
    }
    const { from, to, page = 1, limit = 20 } = req.query;
    const filters = {};
    if (from) filters.fromDate = new Date(from).getTime();
    if (to) filters.toDate = new Date(to).getTime();
    let clicks = clickModel.getByLinkId(id, filters);

    const start = (page - 1) * limit;
    const end = start + Number(limit);
    const paginated = clicks.slice(start, end);
    res.json({
      data: paginated,
      total: clicks.length,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(clicks.length / limit)
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
exports.getDaily = (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const link = linkModel.getById(id, req.user.id);
    if (!link) {
      return res.status(404).json({ error: 'Ссылка не найдена' });
    }
    const daily = clickModel.getDailyStats(id);
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
exports.getGeo = (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const link = linkModel.getById(id, req.user.id);
    if (!link) {
      return res.status(404).json({ error: 'Ссылка не найдена' });
    }
    const geo = clickModel.getGeoStats(id);
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
exports.getDevices = (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const link = linkModel.getById(id, req.user.id);
    if (!link) {
      return res.status(404).json({ error: 'Ссылка не найдена' });
    }
    const devices = clickModel.getDeviceStats(id);
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
exports.getReferrers = (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const link = linkModel.getById(id, req.user.id);
    if (!link) {
      return res.status(404).json({ error: 'Ссылка не найдена' });
    }
    const referrers = clickModel.getReferrerStats(id);
    res.json(referrers);
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
exports.getOverview = (req, res, next) => {
  try {
    const userId = req.user.id;
    const links = linkModel.getUserLinks(userId);
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
exports.exportCSV = (req, res) => {
  const id = Number(req.params.id);
  const link = linkModel.getById(id, req.user.id);
  if (!link) {
    return res.status(404).json({ error: 'Ссылка не найдена' });
  }

  res.json({ message: 'CSV будет сгенерирован' });
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
exports.exportPDF = (req, res) => {
  const id = Number(req.params.id);
  const link = linkModel.getById(id, req.user.id);
  if (!link) {
    return res.status(404).json({ error: 'Ссылка не найдена' });
  }
  res.json({ message: 'PDF будет сгенерирован' });
};