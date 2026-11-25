'use strict';

const mongoose = require('mongoose');
const Group = require('../models/Group');
const Link = require('../models/Link');
const { resolveOwnerId } = require('../utils/owner');
const httpError = require('../utils/httpError');

/** GET /api/groups — список групп с виртуальным populate ссылок. */
exports.listGroups = async (req, res) => {
  const filter = {};
  if (req.query.ownerId) {
    if (!mongoose.isValidObjectId(req.query.ownerId)) {
      throw httpError(400, 'ownerId должен быть корректным ObjectId');
    }
    filter.ownerId = req.query.ownerId;
  }

  const groups = await Group.find(filter)
    .sort({ createdAt: -1 })
    .populate('ownerId', 'email name')
    .populate('links', 'shortCode alias title status clickCount tags');

  res.json(groups);
};

/** GET /api/groups/:id — группа + populate владельца и ссылок. */
exports.getGroup = async (req, res) => {
  const group = await Group.findById(req.params.id)
    .populate('ownerId', 'email name profile')
    .populate('links', 'shortCode alias title status clickCount tags createdAt');

  if (!group) throw httpError(404, 'Группа не найдена');
  res.json(group);
};

/** POST /api/groups */
exports.createGroup = async (req, res) => {
  const body = req.body || {};
  const ownerId = await resolveOwnerId(body.ownerId);

  const group = await Group.create({
    name: body.name,
    description: body.description,
    color: body.color,
    ownerId
  });

  res.status(201).json(group);
};

/** PUT/PATCH /api/groups/:id */
exports.updateGroup = async (req, res) => {
  const body = req.body || {};
  const update = {};

  if (body.name !== undefined) update.name = body.name;
  if (body.description !== undefined) update.description = body.description;
  if (body.color !== undefined) update.color = body.color;
  if (body.ownerId !== undefined) update.ownerId = await resolveOwnerId(body.ownerId);

  if (Object.keys(update).length === 0) {
    throw httpError(400, 'Нет полей для обновления');
  }

  const group = await Group.findByIdAndUpdate(req.params.id, update, {
    returnDocument: 'after',
    runValidators: true
  });

  if (!group) throw httpError(404, 'Группа не найдена');
  res.json(group);
};

/** DELETE /api/groups/:id — каскадное удаление ссылок группы. */
exports.deleteGroup = async (req, res) => {
  const group = await Group.findById(req.params.id);
  if (!group) throw httpError(404, 'Группа не найдена');

  const linksResult = await Link.deleteMany({ groupId: group._id });
  await group.deleteOne();

  res.json({
    message: 'Группа и все её ссылки удалены (каскад в коде)',
    deletedGroup: group,
    deletedLinks: linksResult.deletedCount
  });
};
