'use strict';

module.exports = (sequelize, DataTypes) => {
  const Link = sequelize.define('Link', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    originalUrl: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    shortCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    alias: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true
    },
    expiresAt: {
      type: DataTypes.BIGINT,
      allowNull: true,
      get() {
        const v = this.getDataValue('expiresAt');
        return v === null || v === undefined ? null : Number(v);
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true
    },
    groupId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    utmParams: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    clicks: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    maxClicks: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    deletedAt: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: 'deleted_at',
      get() {
        const v = this.getDataValue('deletedAt');
        return v === null || v === undefined ? null : Number(v);
      }
    }
  }, {
    tableName: 'links',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['short_code'], unique: true },
      { fields: ['group_id'] }
    ]
  });

  Link.associate = (models) => {
    Link.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    Link.belongsTo(models.Group, { foreignKey: 'groupId', as: 'group' });
    Link.hasMany(models.Click, { foreignKey: 'linkId', as: 'clicks_data' });
  };

  return Link;
};