const userModel = require('../models/userModel');
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
  const { password, ...userWithoutPassword } = req.user;
  res.json(userWithoutPassword);
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
exports.updateProfile = (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Имя обязательно' });
    }
    const updated = userModel.update(req.user.id, { name });
    if (!updated) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    const { password, ...userWithoutPassword } = updated;
    res.json(userWithoutPassword);
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
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Старый и новый пароль обязательны' });
    }
    const user = userModel.getById(req.user.id);
    const valid = await bcrypt.compare(oldPassword, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Неверный старый пароль' });
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    userModel.update(req.user.id, { password: hashed });
    res.json({ message: 'Пароль успешно изменен' });
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
exports.updateSettings = (req, res, next) => {
  try {
    const { language, timezone, notifications } = req.body;
    const settings = {};
    if (language) settings['settings.language'] = language;
    if (timezone) settings['settings.timezone'] = timezone;
    if (notifications !== undefined) settings['settings.notifications'] = notifications;
    const updated = userModel.update(req.user.id, settings);
    if (!updated) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    const { password, ...userWithoutPassword } = updated;
    res.json(userWithoutPassword);
  } catch (err) {
    next(err);
  }
};