'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('groups', [
      {
        id: 1,
        user_id: 1,
        name: 'Work',
        description: 'Рабочие ссылки',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 2,
        user_id: 1,
        name: 'Personal',
        description: 'Личные ссылки',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('groups', null, { truncate: true, restartIdentity: true, cascade: true });
  }
};