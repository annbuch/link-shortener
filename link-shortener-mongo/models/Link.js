'use strict';

const mongoose = require('mongoose');
const { generateShortCode } = require('../utils/shortCode');

/**
 * Вложенный документ клика. Хранится прямо в массиве `Link.clicks`,
 * а не в отдельной коллекции, как таблица `clicks` в PostgreSQL.
 */
const clickSchema = new mongoose.Schema(
  {
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    referer: { type: String, default: 'direct' },
    location: {
      country: { type: String, default: 'BY' },
      city: { type: String, default: 'Минск' }
    },
    device: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet', 'unknown'],
      default: 'unknown'
    },
    browser: { type: String, default: 'Other' },
    os: { type: String, default: 'Other' },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: true }
);

const linkSchema = new mongoose.Schema(
  {
    originalUrl: {
      type: String,
      required: [true, 'originalUrl обязателен'],
      trim: true,
      validate: {
        validator: (value) => /^https?:\/\/[^\s]+$/i.test(value),
        message: 'originalUrl должен начинаться с http:// или https://'
      }
    },
    shortCode: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true
    },
    alias: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      maxlength: [100, 'alias не длиннее 100 символов'],
      match: [/^[a-z0-9_-]+$/i, 'alias может содержать только латиницу, цифры, - и _'],
      set: (value) => (value === '' || value === null ? undefined : value)
    },
    title: {
      type: String,
      default: '',
      trim: true,
      maxlength: [200, 'title не длиннее 200 символов']
    },
    tags: {
      type: [{ type: String, lowercase: true, trim: true }],
      default: []
    },
    status: {
      type: String,
      enum: ['active', 'disabled', 'expired'],
      default: 'active'
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'ownerId обязателен'],
      index: true
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      default: null,
      index: true
    },
    utm: {
      source: { type: String, default: '' },
      medium: { type: String, default: '' },
      campaign: { type: String, default: '' }
    },
    passwordHash: {
      type: String,
      default: null,
      select: false
    },
    expiresAt: { type: Date, default: null },
    maxClicks: {
      type: Number,
      default: null,
      min: [1, 'maxClicks должен быть больше 0']
    },
    clickCount: {
      type: Number,
      default: 0,
      min: 0
    },
    // Главная демонстрация документной модели: массив вложенных документов
    clicks: {
      type: [clickSchema],
      default: []
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret.__v;
        delete ret.passwordHash;
        return ret;
      }
    },
    toObject: { virtuals: true }
  }
);

// Дополнительные индексы (уникальные для shortCode/alias уже заданы в полях)
linkSchema.index({ tags: 1 });
linkSchema.index({ 'clicks.location.country': 1 });
linkSchema.index({ ownerId: 1, createdAt: -1 });

linkSchema.virtual('isExpired').get(function isExpired() {
  return Boolean(this.expiresAt && this.expiresAt.getTime() < Date.now());
});

/** Виртуальное поле с готовым коротким URL (BASE_URL из .env). */
linkSchema.virtual('shortUrl').get(function shortUrl() {
  const base = process.env.BASE_URL || 'http://localhost:3001';
  return `${base.replace(/\/$/, '')}/${this.alias || this.shortCode}`;
});

/** Генерирует shortCode, если он не передан явно. */
linkSchema.pre('validate', function preValidate() {
  if (!this.shortCode) {
    this.shortCode = generateShortCode();
  }
});

/** Instance method: добавить клик во вложенный массив. */
linkSchema.methods.registerClick = async function registerClick(payload = {}) {
  this.clicks.push(payload);
  this.clickCount = this.clicks.length;

  if (this.maxClicks && this.clickCount >= this.maxClicks) {
    this.status = 'expired';
  }

  return this.save();
};

/** Проверка доступности ссылки для редиректа (срок, лимит, статус). */
linkSchema.methods.checkAvailability = function checkAvailability() {
  if (this.status === 'disabled') {
    return { ok: false, status: 410, message: 'Ссылка отключена' };
  }
  if (this.expiresAt && this.expiresAt.getTime() < Date.now()) {
    return { ok: false, status: 410, message: 'Срок действия ссылки истёк' };
  }
  if (this.maxClicks && this.clickCount >= this.maxClicks) {
    return { ok: false, status: 410, message: 'Лимит переходов исчерпан' };
  }
  return { ok: true };
};

/** Static method: поиск по тегу (поле-массив содержит значение). */
linkSchema.statics.findByTag = function findByTag(tag) {
  return this.find({ tags: String(tag).toLowerCase() }).sort({ createdAt: -1 });
};

/** Static method: найти ссылку по shortCode или alias. */
linkSchema.statics.findByCode = function findByCode(code) {
  const normalized = String(code).toLowerCase();
  return this.findOne({ $or: [{ shortCode: normalized }, { alias: normalized }] });
};

module.exports = mongoose.model('Link', linkSchema);
