const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { verifyAccessToken, extractBearerToken } = require('../utils/tokenService');

// Проверка JWT для защищённых маршрутов: Authorization: Bearer <token>
const authenticate = async (req, res, next) => {
  const { token, error } = extractBearerToken(req);
  if (!token) {
    return res.status(401).json({ error });
  }
  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Срок действия токена истёк, обновите токен' });
    }
    return res.status(401).json({ error: 'Недействительный токен' });
  }
  if (decoded.type !== 'access') {
    return res.status(401).json({ error: 'Ожидается access-токен' });
  }
  const user = await User.findByPk(decoded.id);
  if (!user) {
    return res.status(401).json({ error: 'Пользователь не найден' });
  }
  req.user = user;
  req.auth = decoded;
  next();
};

// Мягкий вариант: если токен валиден — req.user заполняется, иначе запрос идёт без пользователя
const optionalAuth = async (req, res, next) => {
  const { token } = extractBearerToken(req);
  if (!token) return next();
  try {
    const decoded = verifyAccessToken(token);
    if (decoded.type !== 'access') return next();
    const user = await User.findByPk(decoded.id);
    if (user) {
      req.user = user;
      req.auth = decoded;
    }
  } catch (err) {
    // невалидный токен просто игнорируем
  }
  next();
};

module.exports = { authenticate, optionalAuth };