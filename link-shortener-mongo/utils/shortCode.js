'use strict';

const crypto = require('crypto');

// Без похожих символов (0/O, 1/l/I), чтобы код было удобно диктовать.
const ALPHABET = 'abcdefghijkmnopqrstuvwxyz23456789';

/** Генерирует случайный короткий код (по умолчанию 7 символов). */
function generateShortCode(length = 7) {
  const bytes = crypto.randomBytes(length);
  let code = '';
  for (let i = 0; i < length; i += 1) {
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return code;
}

/** Экранирует спецсимволы регулярного выражения для безопасного поиска. */
function escapeRegex(value = '') {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = { generateShortCode, escapeRegex };
