const Joi = require('joi');
const { USER_ROLES, PASSWORD_CONFIG } = require('../utils/constants');

const loginValidator = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
    'string.empty': 'Email cannot be empty',
  }),
  password: Joi.string()
    .min(PASSWORD_CONFIG.MIN_LENGTH)
    .required()
    .messages({
      'string.min': `Password must be at least ${PASSWORD_CONFIG.MIN_LENGTH} characters long`,
      'any.required': 'Password is required',
      'string.empty': 'Password cannot be empty',
    }),
});

module.exports = {
  loginValidator,
};
