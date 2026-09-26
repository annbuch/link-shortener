'use strict';

module.exports = (sequelize, DataTypes) => {
  const Group = sequelize.define('Group', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      defaultValue: ''
    }
  }, {
    tableName: 'groups',
    timestamps: true,
    underscored: true
  });

  Group.associate = (models) => {
    Group.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    Group.hasMany(models.Link, { foreignKey: 'groupId', as: 'links' });
  };

  return Group;
};