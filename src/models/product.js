'use strict';
const { Model, DataTypes } = require('sequelize');
const { PRODUCT_UNITS } = require('../utils/constants');

module.exports = sequelize => {
  class Product extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Define associations here if needed in the future
      // For example: Product.hasMany(models.OrderItem, { foreignKey: 'product_id' });
    }

    /**
     * Get product data in a clean format
     */
    toJSON() {
      const values = { ...this.get() };
      return values;
    }
  }

  Product.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(200),
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: {
            msg: 'Product name is required',
          },
          len: {
            args: [2, 200],
            msg: 'Product name must be between 2 and 200 characters',
          },
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
          len: {
            args: [0, 1000],
            msg: 'Description cannot exceed 1000 characters',
          },
        },
      },
      unit: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
          isIn: {
            args: [Object.values(PRODUCT_UNITS)],
            msg: 'Invalid unit. Must be one of the allowed values',
          },
          notEmpty: {
            msg: 'Unit is required',
          },
        },
      },
    },
    {
      sequelize,
      modelName: 'Product',
      tableName: 'products',
      indexes: [
        {
          fields: ['name'],
        },
        {
          fields: ['unit'],
        },
      ],
    }
  );

  return Product;
};
