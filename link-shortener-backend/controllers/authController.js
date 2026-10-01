const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const {
  BCRYPT_ROUNDS,
  issueTokenPair,
  hashToken,
  verifyRefreshToken
} = require('../utils/tokenService');

const publicUser = (user) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  isVerified: user.isVerified,
  lastLoginAt: user.lastLoginAt,
  settings: user.settings,
  createdAt: user.createdAt
});

const hashPassword = (password) => bcrypt.hash(password, BCRYPT_ROUNDS);

// Регистрация
/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Регистрация нового пользователя
 *     description: Хеширует пароль через bcrypt (10 раундов) и сохраняет пользователя в PostgreSQL. Возвращает пару токенов.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Пользователь успешно зарегистрирован
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Некорректные данные или пользователь уже существует
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Внутренняя ошибка сервера
 */
exports.register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email и пароль обязательны' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Некорректный email' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Пароль должен содержать минимум 6 символов' });
    }
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
    }
    const user = await User.create({
      email,
      passwordHash: await hashPassword(password),
      name: name && name.trim() ? name.trim() : email.split('@')[0],
      role: 'user',
      isVerified: true,
      settings: { language: 'ru', timezone: 'Europe/Minsk', notifications: true }
    });
    const { token, refreshToken } = issueTokenPair(user);
    await user.update({ refreshToken: hashToken(refreshToken), lastLoginAt: Date.now() });
    res.status(201).json({ token, refreshToken, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
};

// Логин
/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Вход пользователя
 *     description: Сверяет пароль с bcrypt-хешем и выдаёт пару токенов (access + refresh). В БД сохраняется только sha256-хеш refresh-токена.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Успешный вход
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Неверный email или пароль
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       400:
 *         description: Не указаны email или пароль
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email и пароль обязательны' });
    }
    const user = await User.scope('withSecrets').findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }
    const { token, refreshToken } = issueTokenPair(user);
    await user.update({ refreshToken: hashToken(refreshToken), lastLoginAt: Date.now() });
    res.json({ token, refreshToken, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
};

// Обновление пары токенов по refresh-токену (с ротацией refresh-токена)
/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     summary: Обновление JWT-токенов по refresh-токену
 *     description: Проверяет refresh-токен, сверяет его с хешем в БД и выдаёт новую пару. Старый refresh-токен после использования недействителен (ротация).
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshRequest'
 *     responses:
 *       200:
 *         description: Новая пара токенов
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Refresh-токен недействителен, истёк или уже использован
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
exports.refresh = async (req, res) => {
  const refreshToken = req.body && req.body.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ error: 'Требуется refresh-токен' });
  }
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (err) {
    const message = err instanceof jwt.TokenExpiredError
      ? 'Срок действия refresh-токена истёк'
      : 'Недействительный refresh-токен';
    return res.status(401).json({ error: message });
  }
  if (decoded.type !== 'refresh') {
    return res.status(401).json({ error: 'Ожидается refresh-токен' });
  }
  const user = await User.scope('withSecrets').findByPk(decoded.id);
  if (!user) {
    return res.status(401).json({ error: 'Пользователь не найден' });
  }
  if (!user.refreshToken || user.refreshToken !== hashToken(refreshToken)) {
    return res.status(401).json({
      error: 'Refresh-токен отозван или уже использован. Войдите заново.'
    });
  }
  const pair = issueTokenPair(user);
  await user.update({ refreshToken: hashToken(pair.refreshToken) });
  res.json({ token: pair.token, refreshToken: pair.refreshToken, user: publicUser(user) });
};

// Выход: аннулирование refresh-токена (access-токен остаётся до истечения)
/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Выход пользователя (отзыв refresh-токена)
 *     description: Хеш refresh-токена удаляется из БД, поэтому обновить токены после выхода невозможно. Access-токен клиент удаляет у себя.
 *     tags: [Auth]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshRequest'
 *     responses:
 *       200:
 *         description: Выход выполнен успешно
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessage'
 */
exports.logout = async (req, res, next) => {
  try {
    const refreshToken = req.body && req.body.refreshToken;
    if (refreshToken) {
      try {
        const decoded = verifyRefreshToken(refreshToken);
        const user = await User.scope('withSecrets').findByPk(decoded.id);
        if (user && user.refreshToken === hashToken(refreshToken)) {
          await user.update({ refreshToken: null });
        }
      } catch (err) {
        // токен уже невалиден — считаем, что сессия завершена
      }
    }
    res.json({ message: 'Выход выполнен успешно' });
  } catch (err) {
    next(err);
  }
};

// Смена пароля (требует авторизации)
/**
 * @openapi
 * /auth/change-password:
 *   post:
 *     summary: Смена пароля пользователем
 *     description: Проверяет текущий пароль, хеширует новый через bcrypt и завершает все сессии (refresh-токен отзывается).
 *     tags: [Auth]
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
 *         description: Пароль успешно изменён
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessage'
 *       400:
 *         description: Некорректные данные
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Неверный текущий пароль или требуется авторизация
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, oldPassword, newPassword } = req.body;
    const current = currentPassword || oldPassword;
    if (!current || !newPassword) {
      return res.status(400).json({ error: 'Текущий и новый пароль обязательны' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Новый пароль должен содержать минимум 6 символов' });
    }
    const user = await User.scope('withSecrets').findByPk(req.user.id);
    const valid = await bcrypt.compare(current, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Неверный текущий пароль' });
    }
    if (await bcrypt.compare(newPassword, user.passwordHash)) {
      return res.status(400).json({ error: 'Новый пароль должен отличаться от текущего' });
    }
    await user.update({
      passwordHash: await hashPassword(newPassword),
      refreshToken: null
    });
    res.json({ message: 'Пароль успешно изменён. Все сессии завершены, войдите заново.' });
  } catch (err) {
    next(err);
  }
};

// Запрос на восстановление пароля (заглушка: реальная отправка письма не реализована)
/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     summary: Запрос на восстановление пароля
 *     description: Заглушка. Ответ всегда 200, чтобы нельзя было перебором узнать, зарегистрирован ли email.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Инструкции отправлены на email
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessage'
 *       400:
 *         description: Email не указан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
exports.forgotPassword = (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Email обязателен' });
  res.json({ message: 'Инструкции по восстановлению отправлены на email' });
};

// Сброс пароля (заглушка: без токена письма, только по email)
/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     summary: Сброс пароля по email
 *     description: Заглушка. Токен подтверждения письма не реализован, пароль меняется по email запроса. refresh-токены аннулируются.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: newpassword123
 *     responses:
 *       200:
 *         description: Пароль успешно изменён
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessage'
 *       400:
 *         description: Не указан email или новый пароль
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
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ error: 'Email и новый пароль обязательны' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Пароль должен содержать минимум 6 символов' });
    }
    const user = await User.scope('withSecrets').findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    await user.update({
      passwordHash: await hashPassword(newPassword),
      refreshToken: null
    });
    res.json({ message: 'Пароль успешно изменён' });
  } catch (err) {
    next(err);
  }
};