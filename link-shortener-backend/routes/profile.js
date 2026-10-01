const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middlewares/auth');

// Все маршруты профиля доступны только авторизованному пользователю
router.use(authenticate);

/**
 * @openapi
 * /profile:
 *   get:
 *     summary: Получить данные текущего пользователя
 *     description: 'Защищённый маршрут. Требуется заголовок Authorization: Bearer <access-токен>. Без токена — 401.'
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Данные текущего пользователя (passwordHash и refreshToken не возвращаются)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Токен отсутствует, недействителен или истёк
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', userController.getProfile);

/**
 * @openapi
 * /profile:
 *   delete:
 *     summary: Удалить аккаунт текущего пользователя
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Аккаунт удалён (ссылки и группы удалены каскадом)
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
router.delete('/', userController.deleteProfile);

module.exports = router;