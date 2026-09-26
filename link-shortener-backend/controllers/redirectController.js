const { Link, Click } = require('../models');

// GET /:shortCode - редирект
/**
 * @openapi
 * /{shortCode}:
 *   get:
 *     summary: Переход по короткой ссылке
 *     tags: [Redirect]
 *     parameters:
 *       - in: path
 *         name: shortCode
 *         required: true
 *         schema:
 *           type: string
 *         description: Короткий код ссылки (например, abc123)
 *     responses:
 *       302:
 *         description: Перенаправление на оригинальный URL
 *         headers:
 *           Location:
 *             schema:
 *               type: string
 *             description: Оригинальный URL
 *       401:
 *         description: Ссылка защищена паролем, требуется верификация
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Требуется пароль
 *                 shortCode:
 *                   type: string
 *                   example: abc123
 *       404:
 *         description: Ссылка не найдена
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Ссылка не найдена
 *       410:
 *         description: Ссылка деактивирована или срок действия истек
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Ссылка деактивирована
 */
exports.redirect = async (req, res, next) => {
  try {
    const { shortCode } = req.params;
    const link = await Link.findOne({ where: { shortCode } });
    if (!link) {
      return res.status(404).send('Ссылка не найдена');
    }
    if (!link.isActive) {
      return res.status(410).send('Ссылка деактивирована');
    }
    if (link.deletedAt) {
      return res.status(404).send('Ссылка не найдена');
    }
    if (link.expiresAt && Date.now() > link.expiresAt) {
      return res.status(410).send('Срок действия ссылки истек');
    }
    if (link.maxClicks && link.clicks >= link.maxClicks) {
      return res.status(410).send('Лимит переходов исчерпан');
    }
    if (link.password) {
      return res.status(401).json({ error: 'Требуется пароль', shortCode });
    }

    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    const referer = req.get('Referer') || 'direct';
    const location = { country: 'BY', city: 'Minsk' };

    await Click.create({ linkId: link.id, ip, userAgent, referer, location, timestamp: Date.now() });
    await link.update({ clicks: link.clicks + 1 });
    res.redirect(302, link.originalUrl);
  } catch (err) {
    next(err);
  }
};

// POST /:shortCode/verify - проверка пароля
/**
 * @openapi
 * /{shortCode}/verify:
 *   post:
 *     summary: Проверка пароля для защищённой ссылки
 *     tags: [Redirect]
 *     parameters:
 *       - in: path
 *         name: shortCode
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyPasswordRequest'
 *     responses:
 *       200:
 *         description: Пароль верен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VerifyPasswordResponse'
 *       401:
 *         description: Неверный пароль
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       400:
 *         description: Пароль не указан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Ссылка не найдена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
exports.verifyPassword = async (req, res, next) => {
  try {
    const { shortCode } = req.params;
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: 'Пароль обязателен' });
    }
    const link = await Link.findOne({ where: { shortCode } });
    if (!link) {
      return res.status(404).json({ error: 'Ссылка не найдена' });
    }
    if (link.password !== password) {
      return res.status(401).json({ error: 'Неверный пароль' });
    }
    res.json({ message: 'Пароль верен', redirectUrl: link.originalUrl });
  } catch (err) {
    next(err);
  }
};
