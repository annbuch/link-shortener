'use strict';

const bcrypt = require('bcryptjs');
const Link = require('../models/Link');
const { buildClick } = require('../utils/click');

async function findLinkByCode(code) {
  const link = await Link.findByCode(code).select('+passwordHash');
  return link;
}

function checkLink(link) {
  if (!link) {
    return { ok: false, status: 404, message: 'Ссылка не найдена' };
  }
  return link.checkAvailability();
}

/** GET /:shortCode — редирект + запись клика во вложенный массив. */
exports.redirect = async (req, res) => {
  const link = await findLinkByCode(req.params.shortCode);
  const availability = checkLink(link);

  if (!availability.ok) {
    return res.status(availability.status).send(availability.message);
  }

  if (link.passwordHash) {
    const password = req.query.password;

    if (!password) {
      return res.status(401).json({
        error: 'Ссылка защищена паролем',
        shortCode: link.shortCode,
        requiresPassword: true
      });
    }

    const passwordMatches = await bcrypt.compare(String(password), link.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'Неверный пароль' });
    }
  }

  await link.registerClick(buildClick(req));
  return res.redirect(302, link.originalUrl);
};

/** POST /:shortCode/verify — проверка пароля и запись клика. */
exports.verifyPassword = async (req, res) => {
  const link = await findLinkByCode(req.params.shortCode);
  const availability = checkLink(link);

  if (!availability.ok) {
    return res.status(availability.status).json({ error: availability.message });
  }

  if (link.passwordHash) {
    const passwordMatches = await bcrypt.compare(
      String(req.body.password || ''),
      link.passwordHash
    );
    if (!passwordMatches) {
      return res.status(401).json({ error: 'Неверный пароль' });
    }
  }

  await link.registerClick(buildClick(req));

  return res.json({
    ok: true,
    originalUrl: link.originalUrl,
    clickCount: link.clickCount
  });
};
