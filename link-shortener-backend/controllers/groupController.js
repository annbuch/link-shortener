const groupModel = require('../models/groupModel');
const linkModel = require('../models/linkModel');

// GET /groups
/**
 * @openapi
 * /groups:
 *   get:
 *     summary: Получить все группы пользователя
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список групп
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Group'
 *       401:
 *         description: Требуется авторизация
 */
exports.getAllGroups = (req, res, next) => {
  try {
    const groups = groupModel.getAll(req.user.id);
    res.json(groups);
  } catch (err) {
    next(err);
  }
};

// POST /groups
/**
 * @openapi
 * /groups:
 *   post:
 *     summary: Создать группу
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateGroupRequest'
 *     responses:
 *       201:
 *         description: Группа создана
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Group'
 *       400:
 *         description: Название группы не указано
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Требуется авторизация
 */
exports.createGroup = (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Название группы обязательно' });
    }
    const newGroup = {
      userId: req.user.id,
      name,
      description: description || ''
    };
    const group = groupModel.add(newGroup);
    res.status(201).json(group);
  } catch (err) {
    next(err);
  }
};

// GET /groups/:id
/**
 * @openapi
 * /groups/{id}:
 *   get:
 *     summary: Получить группу со списком ссылок в ней
 *     tags: [Groups]
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
 *         description: Группа с ссылками
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GroupWithLinks'
 *       404:
 *         description: Группа не найдена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Требуется авторизация
 */
exports.getGroupById = (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const group = groupModel.getById(id, req.user.id);
    if (!group) {
      return res.status(404).json({ error: 'Группа не найдена' });
    }
    // Также получаем ссылки в этой группе
    const links = linkModel.getAll({ userId: req.user.id, groupId: id });
    res.json({ ...group, links });
  } catch (err) {
    next(err);
  }
};

// PUT /groups/:id
/**
 * @openapi
 * /groups/{id}:
 *   put:
 *     summary: Обновить группу
 *     tags: [Groups]
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
 *             $ref: '#/components/schemas/UpdateGroupRequest'
 *     responses:
 *       200:
 *         description: Группа обновлена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Group'
 *       404:
 *         description: Группа не найдена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Требуется авторизация
 */
exports.updateGroup = (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { name, description } = req.body;
    const updated = groupModel.update(id, req.user.id, { name, description });
    if (!updated) {
      return res.status(404).json({ error: 'Группа не найдена' });
    }
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

// DELETE /groups/:id
/**
 * @openapi
 * /groups/{id}:
 *   delete:
 *     summary: Удалить группу (ссылки будут перенесены в общую группу)
 *     tags: [Groups]
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
 *         description: Группа удалена
 *       404:
 *         description: Группа не найдена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Требуется авторизация
 */
exports.deleteGroup = (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const result = groupModel.remove(id, req.user.id);
    if (!result) {
      return res.status(404).json({ error: 'Группа не найдена' });
    }
 
    const links = linkModel.getAll({ userId: req.user.id, groupId: id });
    for (const link of links) {
      linkModel.update(link.id, req.user.id, { groupId: null });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};