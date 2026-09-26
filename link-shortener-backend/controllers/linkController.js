const { Link, Group } = require('../models');
const { Op } = require('sequelize');

const generateShortCode = () => Math.random().toString(36).substring(2, 8);

// GET /links
/**
 * @openapi
 * /links:
 *   get:
 *     summary: Получить все ссылки пользователя
 *     tags: [Links]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: groupId
 *         schema:
 *           type: integer
 *         description: Фильтр по группе
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Поиск по оригинальному URL или алиасу
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [createdAt, clicks, originalUrl]
 *         description: Поле для сортировки
 *     responses:
 *       200:
 *         description: Список ссылок
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Link'
 *       401:
 *         description: Требуется авторизация
 */
exports.getAllLinks = async (req, res, next) => {
  try {
    const { groupId, search, sort } = req.query;
    const where = { userId: req.user.id, deletedAt: null };
    if (groupId) where.groupId = Number(groupId);
    if (search) {
      where[Op.or] = [
        { originalUrl: { [Op.iLike]: `%${search}%` } },
        { alias: { [Op.iLike]: `%${search}%` } }
      ];
    }
    const order = sort ? [[sort, 'DESC']] : [['createdAt', 'DESC']];
    const links = await Link.findAll({ where, order });
    res.json(links);
  } catch (err) {
    next(err);
  }
};

// POST /links
/**
 * @openapi
 * /links:
 *   post:
 *     summary: Создать новую ссылку
 *     tags: [Links]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateLinkRequest'
 *     responses:
 *       201:
 *         description: Ссылка успешно создана
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Link'
 *       400:
 *         description: Некорректные данные (неверный URL, alias занят, группа не найдена)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Требуется авторизация
 */
exports.createLink = async (req, res, next) => {
  try {
    const { originalUrl, alias, expiresAt, password, groupId, utmParams, algorithm, maxClicks } = req.body;
    if (!originalUrl) {
      return res.status(400).json({ error: 'originalUrl обязателен' });
    }
    if (!originalUrl.startsWith('http://') && !originalUrl.startsWith('https://')) {
      return res.status(400).json({ error: 'Неверный формат URL' });
    }

    if (groupId) {
      const group = await Group.findOne({ where: { id: Number(groupId), userId: req.user.id } });
      if (!group) {
        return res.status(400).json({ error: 'Группа не найдена' });
      }
    }

    const aliasInUse = alias
      ? await Link.findOne({ where: { alias } })
      : null;
    if (aliasInUse) {
      return res.status(400).json({ error: 'Alias уже используется' });
    }

    let shortCode;
    if (alias) {
      shortCode = alias;
    } else if (algorithm === 'base64') {
      shortCode = Buffer.from(originalUrl).toString('base64url').slice(0, 10);
      const exists = await Link.findOne({ where: { shortCode } });
      if (exists) {
        shortCode = shortCode + Math.floor(Math.random() * 1000);
      }
    } else {
      shortCode = generateShortCode();
    }

    const link = await Link.create({
      userId: req.user.id,
      originalUrl,
      shortCode,
      alias: alias || null,
      expiresAt: expiresAt ? new Date(expiresAt).getTime() : null,
      password: password || null,
      groupId: groupId ? Number(groupId) : null,
      utmParams: utmParams || null,
      maxClicks: maxClicks || null,
      clicks: 0,
      isActive: true,
      deletedAt: null
    });
    res.status(201).json(link);
  } catch (err) {
    next(err);
  }
};

// GET /links/:id
/**
 * @openapi
 * /links/{id}:
 *   get:
 *     summary: Получить ссылку по ID
 *     tags: [Links]
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
 *         description: Данные ссылки
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Link'
 *       404:
 *         description: Ссылка не найдена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Требуется авторизация
 */
exports.getLinkById = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const link = await Link.findOne({ where: { id, userId: req.user.id, deletedAt: null } });
    if (!link) {
      return res.status(404).json({ error: 'Ссылка не найдена' });
    }
    res.json(link);
  } catch (err) {
    next(err);
  }
};

// PUT /links/:id
/**
 * @openapi
 * /links/{id}:
 *   put:
 *     summary: Полное обновление ссылки
 *     tags: [Links]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateLinkRequest'
 *     responses:
 *       200:
 *         description: Ссылка обновлена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Link'
 *       400:
 *         description: Некорректные данные (alias занят, группа не найдена)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Ссылка не найдена
 *       401:
 *         description: Требуется авторизация
 */
exports.updateLink = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { originalUrl, alias, expiresAt, password, groupId, isActive, maxClicks } = req.body;
    const existing = await Link.findOne({ where: { id, userId: req.user.id, deletedAt: null } });
    if (!existing) {
      return res.status(404).json({ error: 'Ссылка не найдена' });
    }
    if (alias && alias !== existing.alias) {
      const conflict = await Link.findOne({ where: { alias, id: { [Op.ne]: id } } });
      if (conflict) {
        return res.status(400).json({ error: 'Alias уже используется' });
      }
    }
    if (groupId) {
      const group = await Group.findOne({ where: { id: Number(groupId), userId: req.user.id } });
      if (!group) {
        return res.status(400).json({ error: 'Группа не найдена' });
      }
    }
    const updates = {};
    if (originalUrl !== undefined) updates.originalUrl = originalUrl;
    if (alias !== undefined) updates.alias = alias;
    if (expiresAt !== undefined) updates.expiresAt = expiresAt ? new Date(expiresAt).getTime() : null;
    if (password !== undefined) updates.password = password;
    if (groupId !== undefined) updates.groupId = groupId ? Number(groupId) : null;
    if (isActive !== undefined) updates.isActive = isActive;
    if (maxClicks !== undefined) updates.maxClicks = maxClicks;

    await existing.update(updates);
    res.json(existing);
  } catch (err) {
    next(err);
  }
};

// DELETE /links/:id (мягкое удаление)
/**
 * @openapi
 * /links/{id}:
 *   delete:
 *     summary: Удалить ссылку (в корзину)
 *     tags: [Links]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Ссылка перемещена в корзину
 *       404:
 *         description: Ссылка не найдена
 *       401:
 *         description: Требуется авторизация
 */
exports.deleteLink = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const link = await Link.findOne({ where: { id, userId: req.user.id, deletedAt: null } });
    if (!link) {
      return res.status(404).json({ error: 'Ссылка не найдена или уже удалена' });
    }
    await link.update({ deletedAt: Date.now() });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

// POST /links/:id/restore
/**
 * @openapi
 * /links/{id}/restore:
 *   post:
 *     summary: Восстановить ссылку из корзины
 *     tags: [Links]
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
 *         description: Ссылка восстановлена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessage'
 *       404:
 *         description: Ссылка не найдена в корзине
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Требуется авторизация
 */
exports.restoreLink = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const link = await Link.findOne({ where: { id, userId: req.user.id, deletedAt: { [Op.ne]: null } } });
    if (!link) {
      return res.status(404).json({ error: 'Ссылка не найдена в корзине' });
    }
    await link.update({ deletedAt: null });
    res.json({ message: 'Ссылка восстановлена' });
  } catch (err) {
    next(err);
  }
};

// GET /links/trash
/**
 * @openapi
 * /links/trash:
 *   get:
 *     summary: Получить ссылки в корзине
 *     tags: [Links]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список удалённых ссылок
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Link'
 *       401:
 *         description: Требуется авторизация
 */
exports.getTrash = async (req, res, next) => {
  try {
    const trash = await Link.findAll({ where: { userId: req.user.id, deletedAt: { [Op.ne]: null } } });
    res.json(trash);
  } catch (err) {
    next(err);
  }
};

// DELETE /links/trash/empty
/**
 * @openapi
 * /links/trash/empty:
 *   delete:
 *     summary: Очистить корзину (безвозвратное удаление всех ссылок)
 *     tags: [Links]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Корзина очищена
 *       401:
 *         description: Требуется авторизация
 */
exports.emptyTrash = async (req, res, next) => {
  try {
    await Link.destroy({ where: { userId: req.user.id, deletedAt: { [Op.ne]: null } } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

// POST /links/:id/activate
/**
 * @openapi
 * /links/{id}/activate:
 *   post:
 *     summary: Активировать ссылку
 *     tags: [Links]
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
 *         description: Ссылка активирована
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Link'
 *       404:
 *         description: Ссылка не найдена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Требуется авторизация
 */
exports.activateLink = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const link = await Link.findOne({ where: { id, userId: req.user.id, deletedAt: null } });
    if (!link) {
      return res.status(404).json({ error: 'Ссылка не найдена' });
    }
    await link.update({ isActive: true });
    res.json(link);
  } catch (err) {
    next(err);
  }
};

// POST /links/:id/deactivate
/**
 * @openapi
 * /links/{id}/deactivate:
 *   post:
 *     summary: Деактивировать ссылку
 *     tags: [Links]
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
 *         description: Ссылка деактивирована
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Link'
 *       404:
 *         description: Ссылка не найдена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Требуется авторизация
 */
exports.deactivateLink = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const link = await Link.findOne({ where: { id, userId: req.user.id, deletedAt: null } });
    if (!link) {
      return res.status(404).json({ error: 'Ссылка не найдена' });
    }
    await link.update({ isActive: false });
    res.json(link);
  } catch (err) {
    next(err);
  }
};

// GET /links/:id/qr (заглушка)
/**
 * @openapi
 * /links/{id}/qr:
 *   get:
 *     summary: Получить QR-код для ссылки
 *     tags: [Links]
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
 *         description: URL для генерации QR-кода
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/QRResponse'
 *       404:
 *         description: Ссылка не найдена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Требуется авторизация
 */
exports.getQR = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const link = await Link.findOne({ where: { id, userId: req.user.id, deletedAt: null } });
    if (!link) {
      return res.status(404).json({ error: 'Ссылка не найдена' });
    }
    res.json({ message: 'QR-код будет сгенерирован', url: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${link.shortCode}` });
  } catch (err) {
    next(err);
  }
};

// GET /links/:id/preview (заглушка)
/**
 * @openapi
 * /links/{id}/preview:
 *   get:
 *     summary: Получить метаданные (OG) для предпросмотра ссылки
 *     tags: [Links]
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
 *         description: Метаданные для предпросмотра
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PreviewResponse'
 *       404:
 *         description: Ссылка не найдена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Требуется авторизация
 */
exports.getPreview = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const link = await Link.findOne({ where: { id, userId: req.user.id, deletedAt: null } });
    if (!link) {
      return res.status(404).json({ error: 'Ссылка не найдена' });
    }
    res.json({
      title: 'Заглушка для превью',
      description: 'Описание сайта',
      image: 'https://via.placeholder.com/150'
    });
  } catch (err) {
    next(err);
  }
};