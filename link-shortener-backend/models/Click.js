'use strict';

module.exports = (sequelize, DataTypes) => {
  const Click = sequelize.define('Click', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    linkId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    ip: {
      type: DataTypes.STRING
    },
    userAgent: {
      type: DataTypes.TEXT,
      field: 'user_agent'
    },
    referer: {
      type: DataTypes.TEXT
    },
    location: {
      type: DataTypes.JSONB,
      defaultValue: { country: 'BY', city: 'Minsk' }
    },
    timestamp: {
      type: DataTypes.BIGINT,
      defaultValue: DataTypes.NOW,
      get() {
        const v = this.getDataValue('timestamp');
        return v === null || v === undefined ? null : Number(v);
      }
    }
  }, {
    tableName: 'clicks',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['link_id'] },
      { fields: ['timestamp'] }
    ]
  });

  Click.associate = (models) => {
    Click.belongsTo(models.Link, { foreignKey: 'linkId', as: 'link' });
  };

  return Click;
};