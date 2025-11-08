'use strict';
const { Model, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { USER_ROLES, PASSWORD_CONFIG } = require('../utils/constants');

module.exports = sequelize => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index.js` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }

    /**
     * Compare password with hashed password
     */
    async comparePassword(password) {
      return bcrypt.compare(password, this.password);
    }

    /**
     * Check if user is admin
     */
    isAdmin() {
      return this.role === USER_ROLES.ADMIN;
    }

    /**
     * Check if user is employee
     */
    isEmployee() {
      return this.role === USER_ROLES.EMPLOYEE;
    }

    /**
     * Get user data without sensitive information
     */
    toJSON() {
      const values = { ...this.get() };
      delete values.password;
      return values;
    }
  }

  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: {
            msg: 'Must be a valid email address',
          },
          notEmpty: {
            msg: 'Email is required',
          },
        },
      },
      user_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'User name is required',
          },
          len: {
            args: [2, 100],
            msg: 'User name must be between 2 and 100 characters',
          },
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'Password is required',
          },
          len: {
            args: [PASSWORD_CONFIG.MIN_LENGTH, 255],
            msg: `Password must be at least ${PASSWORD_CONFIG.MIN_LENGTH} characters long`,
          },
        },
      },
      role: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          isIn: {
            args: [Object.values(USER_ROLES)],
            msg: 'Invalid role',
          },
        },
        defaultValue: USER_ROLES.EMPLOYEE,
      },
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      hooks: {
        beforeCreate: async user => {
          if (user.password) {
            user.password = await bcrypt.hash(user.password, PASSWORD_CONFIG.SALT_ROUNDS);
          }
        },
        beforeUpdate: async user => {
          if (user.changed('password')) {
            user.password = await bcrypt.hash(user.password, PASSWORD_CONFIG.SALT_ROUNDS);
          }
        },
      },
      indexes: [
        {
          unique: true,
          fields: ['email'],
        },
      ],
    }
  );

  return User;
};
