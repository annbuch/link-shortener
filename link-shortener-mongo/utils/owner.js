'use strict';

const mongoose = require('mongoose');
const User = require('../models/User');
const httpError = require('./httpError');

/**
 * Возвращает ObjectId владельца: явно переданный или демо-пользователя.
 * Демо-пользователь создаётся скриптом `npm run seed`.
 */
async function resolveOwnerId(explicitOwnerId) {
  if (explicitOwnerId) {
    if (!mongoose.isValidObjectId(explicitOwnerId)) {
      throw httpError(400, 'ownerId должен быть корректным ObjectId');
    }
    const owner = await User.exists({ _id: explicitOwnerId });
    if (!owner) throw httpError(404, 'Пользователь-владелец не найден');
    return explicitOwnerId;
  }

  const email = process.env.DEMO_OWNER_EMAIL || 'demo@click.me';
  const demoUser = await User.findOne({ email });

  if (!demoUser) {
    throw httpError(
      400,
      `Демо-пользователь ${email} не найден. Выполните npm run seed или передайте ownerId.`
    );
  }

  return demoUser._id;
}

module.exports = { resolveOwnerId };
