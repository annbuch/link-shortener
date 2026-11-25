'use strict';

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'email обязателен'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Некорректный email']
    },
    name: {
      type: String,
      required: [true, 'name обязателен'],
      trim: true,
      maxlength: [100, 'name не длиннее 100 символов']
    },
    // Вложенный документ (subdocument) без отдельной коллекции
    profile: {
      city: { type: String, default: 'Минск', trim: true },
      company: { type: String, default: '', trim: true },
      timezone: { type: String, default: 'Europe/Minsk' }
    },
    settings: {
      language: { type: String, enum: ['ru', 'en'], default: 'ru' },
      notifications: { type: Boolean, default: true },
      theme: { type: String, enum: ['dark', 'light'], default: 'dark' }
    },
    lastLoginAt: { type: Date, default: null }
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
    }
  }
);

// Индекс для ускорения поиска/проверки по email (уникальность задана в поле)
userSchema.index({ 'profile.city': 1 });

module.exports = mongoose.model('User', userSchema);
