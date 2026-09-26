'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('links', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE'
      },
      group_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'groups', key: 'id' },
        onDelete: 'SET NULL'
      },
      original_url: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      short_code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      alias: {
        type: Sequelize.STRING(100),
        allowNull: true,
        unique: true
      },
      expires_at: {
        type: Sequelize.BIGINT,
        allowNull: true
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      utm_params: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      clicks: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      deleted_at: {
        type: Sequelize.BIGINT,
        allowNull: true
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
    await queryInterface.addIndex('links', ['user_id']);
    await queryInterface.addIndex('links', ['group_id']);
    await queryInterface.addIndex('links', ['short_code']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('links');
  }
};