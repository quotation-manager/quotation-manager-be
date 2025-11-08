'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = sequelize => {
  class Customer extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // A customer belongs to a reference
      Customer.belongsTo(models.Reference, {
        foreignKey: 'reference_id',
        as: 'reference',
        onDelete: 'RESTRICT', // Prevent deletion of reference if customers exist
        onUpdate: 'CASCADE',
      });

      // A customer can have many quotations
      Customer.hasMany(models.Quotation, {
        foreignKey: 'customer_id',
        as: 'quotations',
        onDelete: 'RESTRICT', // Prevent deletion of customer if quotations exist
        onUpdate: 'CASCADE',
      });
    }

    /**
     * Get customer data in a clean format
     */
    toJSON() {
      const values = { ...this.get() };
      return values;
    }
  }

  Customer.init(
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
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'Mobile number is required',
          },
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
      address: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
          len: {
            args: [0, 500],
            msg: 'Address cannot exceed 500 characters',
          },
        },
      },
      reference_id: {
        type: DataTypes.UUID,
        allowNull: true,
        validate: {
          isUUID: {
            args: 4,
            msg: 'Reference ID must be a valid UUID',
          },
        },
      },
      gst_number: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
          len: {
            args: [0, 255],
            msg: 'GST number cannot exceed 255 characters',
          },
        },
        comment: 'GST number of the customer (optional)',
      },
    },
    {
      sequelize,
      modelName: 'Customer',
      tableName: 'customers',
      indexes: [
        {
          fields: ['name'],
        },
        {
          fields: ['mobile_no'],
        },
        {
          fields: ['reference_id'],
        },
        {
          unique: true,
          fields: ['name', 'mobile_no'],
          name: 'unique_name_mobile_customers',
        },
      ],
    }
  );

  return Customer;
};
