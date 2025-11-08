'use strict';
const { Model, DataTypes } = require('sequelize');
const { PRICE_TYPES } = require('../utils/constants');

module.exports = sequelize => {
  class Quotation extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Define associations here
      Quotation.belongsTo(models.Customer, {
        foreignKey: 'customer_id',
        as: 'customer',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      });

      Quotation.belongsTo(models.User, {
        foreignKey: 'created_by',
        as: 'creator',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      });

      Quotation.hasMany(models.Item, {
        foreignKey: 'quotation_id',
        as: 'items',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });
    }

    /**
     * Get quotation data in a clean format
     */
    toJSON() {
      const values = { ...this.get() };
      return values;
    }
  }

  Quotation.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      quotation_date: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'Quotation date is required',
          },
        },
      },
      customer_id: {
        type: DataTypes.UUID,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'Customer ID is required',
          },
        },
      },
      last_shared_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      pdf_path: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'S3 path to the generated PDF file',
      },
      remarks: {
        type: DataTypes.STRING(1000),
        allowNull: true,
        validate: {
          len: {
            args: [0, 1000],
            msg: 'Remarks cannot exceed 1000 characters',
          },
        },
        comment: 'Optional remarks for the quotation (max 1000 characters)',
      },
      price_type: {
        type: DataTypes.ENUM(Object.values(PRICE_TYPES)),
        allowNull: false,
        defaultValue: PRICE_TYPES.INCLUSIVE_TAX,
        validate: {
          isIn: {
            args: [Object.values(PRICE_TYPES)],
            msg: 'Invalid price type',
          },
        },
        comment: 'Price type for the quotation - Inclusive Tax or Exclusive Tax',
      },
      created_by: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: 'User who created the quotation',
      },
    },
    {
      sequelize,
      modelName: 'Quotation',
      tableName: 'quotations',
      indexes: [
        {
          fields: ['customer_id'],
        },
        {
          fields: ['quotation_date'],
        },
        {
          fields: ['created_by'],
        },
      ],
    }
  );

  return Quotation;
};
