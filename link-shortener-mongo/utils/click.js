'use strict';

/** Простое определение устройства/браузера/ОС по User-Agent (без внешних зависимостей). */
function parseUserAgent(userAgent = '') {
  const ua = String(userAgent).toLowerCase();

  let device = 'desktop';
  if (/ipad|tablet/.test(ua)) {
    device = 'tablet';
  } else if (/mobile|iphone|android/.test(ua)) {
    device = 'mobile';
  }

  let browser = 'Other';
  if (/edg\//.test(ua)) browser = 'Edge';
  else if (/opr\/|opera/.test(ua)) browser = 'Opera';
  else if (/chrome\//.test(ua)) browser = 'Chrome';
  else if (/firefox\//.test(ua)) browser = 'Firefox';
  else if (/safari\//.test(ua)) browser = 'Safari';

  let os = 'Other';
  if (/windows/.test(ua)) os = 'Windows';
  else if (/android/.test(ua)) os = 'Android';
  else if (/iphone|ipad|ios/.test(ua)) os = 'iOS';
  else if (/mac os|macintosh/.test(ua)) os = 'macOS';
  else if (/linux/.test(ua)) os = 'Linux';

  return { device, browser, os };
}

/**
 * Собирает вложенный документ клика из запроса.
 * Геолокация — учебная заглушка (как в PostgreSQL-версии), но её можно
 * переопределить заголовками X-Country / X-City или телом запроса.
 */
function buildClick(req, overrides = {}) {
  const userAgent = overrides.userAgent || req.get('User-Agent') || '';
  const parsed = parseUserAgent(userAgent);

  return {
    ip: overrides.ip || req.ip || req.socket?.remoteAddress || '127.0.0.1',
    userAgent,
    referer: overrides.referer || req.get('Referer') || 'direct',
    location: {
      country:
        overrides.location?.country ||
        req.get('X-Country') ||
        process.env.DEFAULT_COUNTRY ||
        'BY',
      city:
        overrides.location?.city ||
        req.get('X-City') ||
        process.env.DEFAULT_CITY ||
        'Минск'
    },
    device: overrides.device || parsed.device,
    browser: overrides.browser || parsed.browser,
    os: overrides.os || parsed.os,
    createdAt: overrides.createdAt ? new Date(overrides.createdAt) : new Date()
  };
}

module.exports = { buildClick, parseUserAgent };
