const { Group, Link } = require('../models');

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
exports.getAllGroups = async (req, res, next) => {
  try {
    const groups = await Group.findAll({ where: { userId: req.user.id } });
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
exports.createGroup = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Название группы обязательно' });
    }
    const group = await Group.create({
      userId: req.user.id,
      name,
      description: description || ''
    });
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
exports.getGroupById = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const group = await Group.findOne({ where: { id, userId: req.user.id } });
    if (!group) {
      return res.status(404).json({ error: 'Группа не найдена' });
    }
    const links = await Link.findAll({ where: { userId: req.user.id, groupId: id, deletedAt: null } });
    res.json({ ...group.toJSON(), links });
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
exports.updateGroup = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { name, description } = req.body;
    const group = await Group.findOne({ where: { id, userId: req.user.id } });
    if (!group) {
      return res.status(404).json({ error: 'Группа не найдена' });
    }
    await group.update({ name, description });
    res.json(group);
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
exports.deleteGroup = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const group = await Group.findOne({ where: { id, userId: req.user.id } });
    if (!group) {
      return res.status(404).json({ error: 'Группа не найдена' });
    }
    await Link.update({ groupId: null }, { where: { userId: req.user.id, groupId: id } });
    await group.destroy();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};