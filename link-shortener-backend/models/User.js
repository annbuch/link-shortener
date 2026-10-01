'use strict';

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true }
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'user',
      validate: { isIn: [['user', 'admin']] }
    },
    refreshToken: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    lastLoginAt: {
      type: DataTypes.BIGINT,
      allowNull: true,
      get() {
        return this.getDataValue('lastLoginAt') === null
          ? null
          : Number(this.getDataValue('lastLoginAt'));
      }
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    settings: {
      type: DataTypes.JSONB,
      defaultValue: { language: 'ru', timezone: 'Europe/Minsk', notifications: true }
    }
  }, {
    tableName: 'users',
    timestamps: true,
    underscored: true,
    defaultScope: {
      attributes: { exclude: ['passwordHash', 'refreshToken'] }
    },
    scopes: {
      withSecrets: { attributes: {} }
    }
  });

  User.associate = (models) => {
    User.hasMany(models.Link, { foreignKey: 'userId', as: 'links' });
    User.hasMany(models.Group, { foreignKey: 'userId', as: 'groups' });
  };

  return User;
};