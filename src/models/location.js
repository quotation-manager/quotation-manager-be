'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = sequelize => {
  class Location extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Define associations here if needed in the future
      // For example: Location.hasMany(models.Order, { foreignKey: 'location_id' });
    }

    /**
     * Get location data in a clean format
     */
    toJSON() {
      const values = { ...this.get() };
      return values;
    }
  }

  Location.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: {
            msg: 'Location name is required',
          },
          len: {
            args: [2, 100],
            msg: 'Location name must be between 2 and 100 characters',
          },
        },
      },
    },
    {
      sequelize,
      modelName: 'Location',
      tableName: 'locations',
      indexes: [
        {
          fields: ['name'],
        },
      ],
    }
  );

  return Location;
};
