'use strict';
const { Model, DataTypes } = require('sequelize');
const { PRODUCT_UNITS, DISCOUNT_TYPES, IMAGE_CONFIG } = require('../utils/constants');

module.exports = sequelize => {
  class Item extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Define associations here
      Item.belongsTo(models.Quotation, {
        foreignKey: 'quotation_id',
        as: 'quotation',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });

      Item.belongsTo(models.Product, {
        foreignKey: 'product_id',
        as: 'product',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      });

      Item.belongsTo(models.Location, {
        foreignKey: 'location_id',
        as: 'location',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      });
    }

    /**
     * Get item data in a clean format
     */
    toJSON() {
      const values = { ...this.get() };
      return values;
    }
  }

  Item.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      quotation_id: {
        type: DataTypes.UUID,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'Quotation ID is required',
          },
        },
      },
      product_id: {
        type: DataTypes.UUID,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'Product ID is required',
          },
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      rate: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: {
            args: [0],
            msg: 'Rate must be a positive number',
          },
          notEmpty: {
            msg: 'Rate is required',
          },
        },
      },
      discount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        validate: {
          min: {
            args: [0],
            msg: 'Discount must be a positive number',
          },
        },
      },
      discount_type: {
        type: DataTypes.ENUM(Object.values(DISCOUNT_TYPES)),
        allowNull: true,
        validate: {
          isIn: {
            args: [Object.values(DISCOUNT_TYPES)],
            msg: 'Invalid discount type',
          },
        },
      },
      unit: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
          isIn: {
            args: [Object.values(PRODUCT_UNITS)],
            msg: 'Invalid unit',
          },
          notEmpty: {
            msg: 'Unit is required',
          },
        },
      },
      images: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
        defaultValue: [],
      },
      location_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
          min: {
            args: [1],
            msg: 'Quantity must be a positive integer',
          },
        },
        comment: 'Quantity of the item (positive integer, default 1)',
      },
    },
    {
      sequelize,
      modelName: 'Item',
      tableName: 'items',
      indexes: [
        {
          fields: ['quotation_id'],
        },
        {
          fields: ['product_id'],
        },
        {
          fields: ['location_id'],
        },
      ],
    }
  );

  return Item;
};
