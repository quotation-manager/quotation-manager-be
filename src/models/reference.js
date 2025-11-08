'use strict';
const { Model, DataTypes } = require('sequelize');
const { REFERENCE_CATEGORIES } = require('../utils/constants');

module.exports = sequelize => {
  class Reference extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // A reference can have many customers
      Reference.hasMany(models.Customer, {
        foreignKey: 'reference_id',
        as: 'customers',
        onDelete: 'RESTRICT', // Prevent deletion if customers exist
        onUpdate: 'CASCADE',
      });
    }

    /**
     * Get reference data in a clean format
     */
    toJSON() {
      const values = { ...this.get() };
      return values;
    }
  }

  Reference.init(
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
        validate: {
          notEmpty: {
            msg: 'Name is required',
          },
          len: {
            args: [2, 100],
            msg: 'Name must be between 2 and 100 characters',
          },
        },
      },
      mobile_no: {
        type: DataTypes.STRING(15),
        allowNull: true,
        validate: {
          is: {
            args: /^[+]?[\d\s\-()]+$/,
            msg: 'Please provide a valid mobile number',
          },
          len: {
            args: [10, 15],
            msg: 'Mobile number must be between 10 and 15 characters',
          },
        },
      },
      category: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
          isIn: {
            args: [Object.values(REFERENCE_CATEGORIES)],
            msg: 'Invalid category',
          },
          notEmpty: {
            msg: 'Category is required',
          },
        },
      },
    },
    {
      sequelize,
      modelName: 'Reference',
      tableName: 'references',
      indexes: [
        {
          fields: ['name'],
        },
        {
          fields: ['category'],
        },
        {
          fields: ['mobile_no'],
        },
        {
          unique: true,
          fields: ['name', 'mobile_no'],
          name: 'unique_name_mobile_references',
        },
      ],
    }
  );

  return Reference;
};
