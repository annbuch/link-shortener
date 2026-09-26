'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = Date.now();
    await queryInterface.bulkInsert('links', [
      {
        id: 1,
        user_id: 1,
        group_id: 1,
        original_url: 'https://google.com',
        short_code: 'goog12',
        alias: 'g',
        expires_at: null,
        password: null,
        utm_params: null,
        clicks: 10,
        max_clicks: null,
        is_active: true,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 2,
        user_id: 1,
        group_id: 2,
        original_url: 'https://instagram.com',
        short_code: 'insta3',
        alias: 'insta',
        expires_at: null,
        password: 'secret',
        utm_params: null,
        clicks: 5,
        max_clicks: 100,
        is_active: true,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 3,
        user_id: 2,
        group_id: null,
        original_url: 'https://github.com',
        short_code: 'gh5678',
        alias: 'gh',
        expires_at: now + 30 * 24 * 60 * 60 * 1000,
        password: null,
        utm_params: null,
        clicks: 3,
        max_clicks: null,
        is_active: true,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('links', null, { truncate: true, restartIdentity: true, cascade: true });
  }
};