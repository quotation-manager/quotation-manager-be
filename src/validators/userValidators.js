const Joi = require('joi');
const { USER_ROLES, PASSWORD_CONFIG, PAGINATION } = require('../utils/constants');

const createUserValidator = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
    'string.empty': 'Email cannot be empty',
  }),
  user_name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'User name must be at least 2 characters long',
    'string.max': 'User name cannot exceed 100 characters',
    'any.required': 'User name is required',
    'string.empty': 'User name cannot be empty',
  }),
  password: Joi.string()
    .min(PASSWORD_CONFIG.MIN_LENGTH)
    .required()
    .messages({
      'string.min': `Password must be at least ${PASSWORD_CONFIG.MIN_LENGTH} characters long`,
      'any.required': 'Password is required',
      'string.empty': 'Password cannot be empty',
    }),
  role: Joi.number()
    .valid(...Object.values(USER_ROLES))
    .required()
    .messages({
      'any.only': 'Role must be either 1 (Admin) or 2 (Employee)',
      'any.required': 'Role is required',
    }),
});

const updateUserValidator = Joi.object({
  email: Joi.string().email().optional().messages({
    'string.email': 'Please provide a valid email address',
    'string.empty': 'Email cannot be empty',
  }),
  user_name: Joi.string().min(2).max(100).optional().messages({
    'string.min': 'User name must be at least 2 characters long',
    'string.max': 'User name cannot exceed 100 characters',
    'string.empty': 'User name cannot be empty',
  }),
  password: Joi.string()
    .min(PASSWORD_CONFIG.MIN_LENGTH)
    .allow('')
    .optional()
    .messages({
      'string.min': `Password must be at least ${PASSWORD_CONFIG.MIN_LENGTH} characters long`,
    }),
  role: Joi.number()
    .valid(...Object.values(USER_ROLES))
    .optional()
    .messages({
      'any.only': 'Role must be either 1 (Admin) or 2 (Employee)',
    }),
})
  .min(1)
  .messages({
    'object.min': 'At least one field must be provided for update',
  });

const getUsersValidator = Joi.object({
  page: Joi.string()
    .pattern(/^\d+$/)
    .custom((value, helpers) => {
      const num = parseInt(value, 10);
      if (num < 1) {
        return helpers.error('number.min');
      }
      return num;
    })
    .default(PAGINATION.DEFAULT_PAGE.toString())
    .messages({
      'string.pattern.base': 'Page must be a valid number',
      'number.min': 'Page must be at least 1',
    }),
  limit: Joi.string()
    .pattern(/^\d+$/)
    .custom((value, helpers) => {
      const num = parseInt(value, 10);
      if (num < 1) {
        return helpers.error('number.min');
      }
      if (num > PAGINATION.MAX_LIMIT) {
        return helpers.error('number.max');
      }
      return num;
    })
    .default(PAGINATION.DEFAULT_LIMIT.toString())
    .messages({
      'string.pattern.base': 'Limit must be a valid number',
      'number.min': 'Limit must be at least 1',
      'number.max': `Limit cannot exceed ${PAGINATION.MAX_LIMIT}`,
    }),
  name: Joi.string().max(100).optional().messages({
    'string.max': 'Name filter cannot exceed 100 characters',
  }),
});

const userIdValidator = Joi.object({
  id: Joi.string().uuid().required().messages({
    'string.guid': 'Invalid user ID format',
    'any.required': 'User ID is required',
    'string.empty': 'User ID cannot be empty',
  }),
});

const changePasswordValidator = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': 'Current password is required',
    'string.empty': 'Current password cannot be empty',
  }),
  newPassword: Joi.string()
    .min(PASSWORD_CONFIG.MIN_LENGTH)
    .required()
    .messages({
      'string.min': `Password must be at least ${PASSWORD_CONFIG.MIN_LENGTH} characters long`,
      'any.required': 'New password is required',
      'string.empty': 'New password cannot be empty',
    }),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    'any.only': 'New password and confirm password must match',
    'any.required': 'Confirm password is required',
    'string.empty': 'Confirm password cannot be empty',
  }),
});

module.exports = {
  createUserValidator,
  updateUserValidator,
  getUsersValidator,
  userIdValidator,
  changePasswordValidator,
};
