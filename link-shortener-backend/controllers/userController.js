const { User } = require('../models');
const bcrypt = require('bcryptjs');

// Получить профиль текущего пользователя
/**
 * @openapi
 * /users/me:
 *   get:
 *     summary: Получить профиль текущего пользователя
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Профиль пользователя
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Требуется авторизация
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
exports.getProfile = (req, res) => {
  res.json(req.user.toJSON());
};

// Обновить профиль
/**
 * @openapi
 * /users/me:
 *   put:
 *     summary: Обновить профиль пользователя
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfileRequest'
 *     responses:
 *       200:
 *         description: Профиль обновлен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Имя не указано
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Требуется авторизация
 *       404:
 *         description: Пользователь не найден
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Имя обязательно' });
    }
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    await user.update({ name });
    res.json(user.toJSON());
  } catch (err) {
    next(err);
  }
};

// Удаление аккаунта (все ссылки и группы удаляются каскадом в БД)
/**
 * @openapi
 * /profile:
 *   delete:
 *     summary: Удаление аккаунта текущего пользователя
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Аккаунт удалён
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessage'
 *       401:
 *         description: Требуется авторизация
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Пользователь не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
exports.deleteProfile = async (req, res, next) => {
  try {
    const deleted = await User.destroy({ where: { id: req.user.id } });
    if (!deleted) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    res.json({ message: 'Аккаунт удалён' });
  } catch (err) {
    next(err);
  }
};

// Смена пароля
/**
 * @openapi
 * /users/me/password:
 *   put:
 *     summary: Смена пароля пользователя
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordRequest'
 *     responses:
 *       200:
 *         description: Пароль успешно изменен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessage'
 *       400:
 *         description: Не указаны старый или новый пароль
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Неверный старый пароль или требуется авторизация
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
exports.changePassword = async (req, res, next) => {
  try {
    const { oldPassword, currentPassword, newPassword } = req.body;
    const current = currentPassword || oldPassword;
    if (!current || !newPassword) {
      return res.status(400).json({ error: 'Старый и новый пароль обязательны' });
    }
    const user = await User.scope('withSecrets').findByPk(req.user.id);
    const valid = await bcrypt.compare(current, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Неверный старый пароль' });
    }
    if (await bcrypt.compare(newPassword, user.passwordHash)) {
      return res.status(400).json({ error: 'Новый пароль должен отличаться от текущего' });
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    await user.update({ passwordHash: hashed, refreshToken: null });
    res.json({ message: 'Пароль успешно изменен. Все сессии завершены, войдите заново.' });
  } catch (err) {
    next(err);
  }
};

// Получить настройки
/**
 * @openapi
 * /users/me/settings:
 *   get:
 *     summary: Получить настройки пользователя
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Настройки пользователя
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 language:
 *                   type: string
 *                   example: ru
 *                 timezone:
 *                   type: string
 *                   example: Europe/Minsk
 *                 notifications:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: Требуется авторизация
 */
exports.getSettings = (req, res) => {
  res.json(req.user.settings || {});
};

// Обновить настройки
/**
 * @openapi
 * /users/me/settings:
 *   put:
 *     summary: Обновить настройки пользователя
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateSettingsRequest'
 *     responses:
 *       200:
 *         description: Настройки обновлены
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Требуется авторизация
 *       404:
 *         description: Пользователь не найден
 */
exports.updateSettings = async (req, res, next) => {
  try {
    const { language, timezone, notifications } = req.body;
    const settings = { ...req.user.settings };
    if (language) settings.language = language;
    if (timezone) settings.timezone = timezone;
    if (notifications !== undefined) settings.notifications = notifications;
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    await user.update({ settings });
    res.json(user.toJSON());
  } catch (err) {
    next(err);
  }
};