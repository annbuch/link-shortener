'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('links', 'max_clicks', {
      type: Sequelize.INTEGER,
      allowNull: true
    });
  },


  async down(queryInterface) {
    await queryInterface.removeColumn('links', 'max_clicks');
  }
};