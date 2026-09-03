const linkModel = require('../models/linkModel');
const groupModel = require('../models/groupModel');
const clickModel = require('../models/clickModel');

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
exports.getAllLinks = (req, res, next) => {
  try {
    const { groupId, search, sort } = req.query;
    const filters = { userId: req.user.id };
    if (groupId) filters.groupId = Number(groupId);
    if (search) filters.search = search;
    const links = linkModel.getAll(filters);
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
exports.createLink = (req, res, next) => {
  try {
    const { originalUrl, alias, expiresAt, password, groupId, utmParams, algorithm } = req.body;
    if (!originalUrl) {
      return res.status(400).json({ error: 'originalUrl обязателен' });
    }
    if (!originalUrl.startsWith('http://') && !originalUrl.startsWith('https://')) {
      return res.status(400).json({ error: 'Неверный формат URL' });
    }

    if (groupId) {
      const group = groupModel.getById(Number(groupId), req.user.id);
      if (!group) {
        return res.status(400).json({ error: 'Группа не найдена' });
      }
    }

    let shortCode = generateShortCode();
    if (alias) {
      const existing = linkModel.getAll().find(l => l.alias === alias);
      if (existing) {
        return res.status(400).json({ error: 'Alias уже используется' });
      }
      shortCode = alias;
    }
    const newLink = {
      userId: req.user.id,
      originalUrl,
      shortCode,
      alias: alias || null,
      expiresAt: expiresAt ? new Date(expiresAt).getTime() : null,
      password: password || null,
      groupId: groupId ? Number(groupId) : null,
      utmParams: utmParams || null,
      clicks: 0,
      isActive: true,
      createdAt: Date.now(),
      deletedAt: null
    };
    const link = linkModel.add(newLink);
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
exports.getLinkById = (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const link = linkModel.getById(id, req.user.id);
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
exports.updateLink = (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { originalUrl, alias, expiresAt, password, groupId, isActive } = req.body;
    // Проверяем, что ссылка существует
    const existing = linkModel.getById(id, req.user.id);
    if (!existing) {
      return res.status(404).json({ error: 'Ссылка не найдена' });
    }
    // Если меняем alias, проверяем уникальность
    if (alias && alias !== existing.alias) {
      const conflict = linkModel.getAll().find(l => l.alias === alias && l.id !== id);
      if (conflict) {
        return res.status(400).json({ error: 'Alias уже используется' });
      }
    }
    // Проверка группы
    if (groupId) {
      const group = groupModel.getById(Number(groupId), req.user.id);
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

    const updated = linkModel.update(id, req.user.id, updates);
    if (!updated) {
      return res.status(404).json({ error: 'Ссылка не найдена' });
    }
    res.json(updated);
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
exports.deleteLink = (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const result = linkModel.softDelete(id, req.user.id);
    if (!result) {
      return res.status(404).json({ error: 'Ссылка не найдена или уже удалена' });
    }
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
exports.restoreLink = (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const result = linkModel.restore(id, req.user.id);
    if (!result) {
      return res.status(404).json({ error: 'Ссылка не найдена в корзине' });
    }
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
exports.getTrash = (req, res, next) => {
  try {
    const trash = linkModel.getTrash(req.user.id);
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
exports.emptyTrash = (req, res, next) => {
  try {
    const trash = linkModel.getTrash(req.user.id);
    for (const link of trash) {
      linkModel.hardDelete(link.id, req.user.id);
    }
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
exports.activateLink = (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const updated = linkModel.update(id, req.user.id, { isActive: true });
    if (!updated) {
      return res.status(404).json({ error: 'Ссылка не найдена' });
    }
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

// POST /links/:id/deactivat
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
exports.deactivateLink = (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const updated = linkModel.update(id, req.user.id, { isActive: false });
    if (!updated) {
      return res.status(404).json({ error: 'Ссылка не найдена' });
    }
    res.json(updated);
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
exports.getQR = (req, res) => {
  const id = Number(req.params.id);
  const link = linkModel.getById(id, req.user.id);
  if (!link) {
    return res.status(404).json({ error: 'Ссылка не найдена' });
  }
  // В реальности нужно генерировать QR-код и возвращать изображение
  res.json({ message: 'QR-код будет сгенерирован', url: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${link.shortCode}` });
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
exports.getPreview = (req, res) => {
  const id = Number(req.params.id);
  const link = linkModel.getById(id, req.user.id);
  if (!link) {
    return res.status(404).json({ error: 'Ссылка не найдена' });
  }
 
  res.json({
    title: 'Заглушка для превью',
    description: 'Описание сайта',
    image: 'https://via.placeholder.com/150'
  });
};