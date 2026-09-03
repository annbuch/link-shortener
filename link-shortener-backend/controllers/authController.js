const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';
const JWT_EXPIRES_IN = '7d';

// Регистрация
/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Регистрация нового пользователя
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
 *               $ref: '#/components/schemas/User'
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
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Все поля обязательны' });
    }
    // Проверка существующего пользователя
    const existing = userModel.getByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
    }
    // Хэширование пароля
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      email,
      password: hashedPassword,
      name,
      settings: {
        language: 'ru',
        timezone: 'Europe/Minsk',
        notifications: true
      },
      createdAt: Date.now()
    };
    const user = userModel.add(newUser);
    // Не возвращаем пароль
    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json(userWithoutPassword);
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
    const user = userModel.getByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    next(err);
  }
};

// Выход (на клиенте удалить токен, здесь просто успешный ответ)
/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Выход пользователя (инвалидация токена)
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Выход выполнен успешно
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessage'
 */
exports.logout = (req, res) => {
  res.status(200).json({ message: 'Выход выполнен успешно' });
};

// обновление токена (refresh, пока просто новый)
/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     summary: Обновление JWT-токена
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Новый токен успешно выдан
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       401:
 *         description: Недействительный токен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
exports.refresh = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Требуется токен' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = userModel.getById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'Пользователь не найден' });
    }
    const newToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    res.json({ token: newToken });
  } catch (err) {
    return res.status(401).json({ error: 'Недействительный токен' });
  }
};

// Запрос на восстановление пароля (заглушка)
/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     summary: Запрос на восстановление пароля
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
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email обязателен' });
  // имитация отправки письма
  res.json({ message: 'Инструкции по восстановлению отправлены на email' });
};

// Сброс пароля (заглушка)
/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     summary: Сброс пароля по токену
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *                 example: reset123
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: newpassword123
 *     responses:
 *       200:
 *         description: Пароль успешно изменен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessage'
 *       400:
 *         description: Не указан токен или новый пароль
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
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Токен и новый пароль обязательны' });
    }
    // имитиация проверки токена сброса
    // токены сброса в БД
    const user = userModel.getByEmail('user@example.com'); // заглушка
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    userModel.update(user.id, { password: hashed });
    res.json({ message: 'Пароль успешно изменен' });
  } catch (err) {
    next(err);
  }
};