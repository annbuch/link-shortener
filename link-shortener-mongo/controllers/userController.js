'use strict';

const User = require('../models/User');
const Group = require('../models/Group');
const Link = require('../models/Link');
const httpError = require('../utils/httpError');

/** GET /api/users — список пользователей (демонстрация модели User). */
exports.listUsers = async (req, res) => {
  const users = await User.find().sort({ createdAt: 1 });
  res.json(users);
};

/** GET /api/users/:id */
exports.getUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw httpError(404, 'Пользователь не найден');
  res.json(user);
};

/** POST /api/users */
exports.createUser = async (req, res) => {
  const body = req.body || {};
  const user = await User.create({
    email: body.email,
    name: body.name,
    profile: body.profile,
    settings: body.settings
  });

  res.status(201).json(user);
};

/** PUT/PATCH /api/users/:id */
exports.updateUser = async (req, res) => {
  const body = req.body || {};
  const update = {};

  if (body.email !== undefined) update.email = body.email;
  if (body.name !== undefined) update.name = body.name;
  if (body.profile !== undefined) update.profile = body.profile;
  if (body.settings !== undefined) update.settings = body.settings;
  if (body.lastLoginAt !== undefined) update.lastLoginAt = body.lastLoginAt;

  if (Object.keys(update).length === 0) {
    throw httpError(400, 'Нет полей для обновления');
  }

  const user = await User.findByIdAndUpdate(req.params.id, update, {
    returnDocument: 'after',
    runValidators: true
  });

  if (!user) throw httpError(404, 'Пользователь не найден');
  res.json(user);
};

/** DELETE /api/users/:id — каскад: ссылки и группы пользователя. */
exports.deleteUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw httpError(404, 'Пользователь не найден');

  const [linksResult, groupsResult] = await Promise.all([
    Link.deleteMany({ ownerId: user._id }),
    Group.deleteMany({ ownerId: user._id })
  ]);
  await user.deleteOne();

  res.json({
    message: 'Пользователь, его ссылки и группы удалены (каскад в коде)',
    deletedUser: user,
    deletedLinks: linksResult.deletedCount,
    deletedGroups: groupsResult.deletedCount
  });
};
