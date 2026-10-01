'use strict';

const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const hash = await bcrypt.hash('password123', 10);
    await queryInterface.bulkInsert('users', [
      {
        id: 1,
        name: 'Alice',
        email: 'alice@example.com',
        password_hash: hash,
        role: 'admin',
        refresh_token: null,
        last_login_at: null,
        is_verified: true,
        settings: JSON.stringify({ language: 'ru', timezone: 'Europe/Minsk', notifications: true }),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 2,
        name: 'Bob',
        email: 'bob@example.com',
        password_hash: hash,
        role: 'user',
        refresh_token: null,
        last_login_at: null,
        is_verified: true,
        settings: JSON.stringify({ language: 'en', timezone: 'Europe/Warsaw', notifications: false }),
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', null, { truncate: true, restartIdentity: true, cascade: true });
  }
};