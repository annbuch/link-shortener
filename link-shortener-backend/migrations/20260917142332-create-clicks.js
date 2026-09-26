'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('clicks', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      link_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'links', key: 'id' },
        onDelete: 'CASCADE'
      },
      ip: {
        type: Sequelize.STRING(45),
        allowNull: true
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      referer: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      location: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      timestamp: {
        type: Sequelize.BIGINT,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });
    await queryInterface.addIndex('clicks', ['link_id']);
    await queryInterface.addIndex('clicks', ['timestamp']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('clicks');
  }
};