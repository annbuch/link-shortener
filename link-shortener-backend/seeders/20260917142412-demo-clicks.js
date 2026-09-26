'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const clicks = [];
    for (let i = 0; i < 15; i++) {
      clicks.push({
        link_id: (i % 3) + 1,
        ip: `192.168.1.${(i % 10) + 1}`,
        user_agent: i % 3 === 0
          ? 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36'
          : 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
        referer: i % 2 === 0 ? 'https://google.com' : 'direct',
        location: JSON.stringify({ country: i % 2 === 0 ? 'BY' : 'RU', city: i % 2 === 0 ? 'Minsk' : 'Moscow' }),
        timestamp: new Date(now - i * day).getTime(),
        created_at: new Date(),
        updated_at: new Date()
      });
    }
    await queryInterface.bulkInsert('clicks', clicks, {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('clicks', null, { truncate: true, restartIdentity: true, cascade: true });
  }
};