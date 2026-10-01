'use strict';

const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || `${JWT_SECRET}-refresh`;
const ACCESS_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS) || 10;

const secretFromEnv = Boolean(process.env.JWT_SECRET);

const signAccessToken = (user) => jwt.sign(
  { id: user.id, email: user.email, role: user.role, type: 'access', jti: crypto.randomUUID() },
  JWT_SECRET,
  { expiresIn: ACCESS_EXPIRES_IN }
);

const signRefreshToken = (user) => jwt.sign(
  { id: user.id, type: 'refresh', jti: crypto.randomUUID() },
  JWT_REFRESH_SECRET,
  { expiresIn: REFRESH_EXPIRES_IN }
);

const issueTokenPair = (user) => {
  const token = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  return { token, refreshToken, expiresIn: ACCESS_EXPIRES_IN };
};

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const verifyAccessToken = (token) => jwt.verify(token, JWT_SECRET);
const verifyRefreshToken = (token) => jwt.verify(token, JWT_REFRESH_SECRET);

const extractBearerToken = (req) => {
  const header = req.headers.authorization || req.headers.Authorization;
  if (!header) return { token: null, error: 'Требуется авторизация' };
  const [scheme, value] = String(header).split(' ');
  if (!/^Bearer$/i.test(scheme) || !value) {
    return {
      token: null,
      error: 'Неверный формат токена. Ожидается заголовок Authorization: Bearer <token>'
    };
  }
  return { token: value, error: null };
};

module.exports = {
  JWT_SECRET,
  JWT_REFRESH_SECRET,
  ACCESS_EXPIRES_IN,
  REFRESH_EXPIRES_IN,
  BCRYPT_ROUNDS,
  secretFromEnv,
  signAccessToken,
  signRefreshToken,
  issueTokenPair,
  hashToken,
  verifyAccessToken,
  verifyRefreshToken,
  extractBearerToken
};