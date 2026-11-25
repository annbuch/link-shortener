'use strict';

const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'name группы обязателен'],
      trim: true,
      maxlength: [100, 'name не длиннее 100 символов']
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [500, 'description не длиннее 500 символов']
    },
    color: {
      type: String,
      default: '#8b5cf6',
      match: [/^#[0-9a-fA-F]{6}$/, 'color должен быть HEX-цветом, например #8b5cf6']
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'ownerId обязателен'],
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      }
    },
    toObject: { virtuals: true }
  }
);

// Виртуальная связь: Group -> Link по Link.groupId (аналог hasMany в Sequelize)
groupSchema.virtual('links', {
  ref: 'Link',
  localField: '_id',
  foreignField: 'groupId',
  options: { sort: { createdAt: -1 } }
});

module.exports = mongoose.model('Group', groupSchema);
