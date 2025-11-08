const Joi = require('joi');
const { REFERENCE_CATEGORIES, PAGINATION } = require('../utils/constants');

const createReferenceValidator = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name cannot exceed 100 characters',
    'any.required': 'Name is required',
    'string.empty': 'Name cannot be empty',
  }),
  mobile_no: Joi.string()
    .pattern(/^[+]?[\d\s\-()]+$/)
    .min(10)
    .max(15)
    .allow('', null)
    .optional()
    .messages({
      'string.pattern.base': 'Please provide a valid mobile number',
      'string.min': 'Mobile number must be at least 10 characters long',
      'string.max': 'Mobile number cannot exceed 15 characters',
    }),
  category: Joi.string()
    .valid(...Object.values(REFERENCE_CATEGORIES))
    .required()
    .messages({
      'any.only': `Category must be one of: ${Object.values(REFERENCE_CATEGORIES).join(', ')}`,
      'any.required': 'Category is required',
      'string.empty': 'Category cannot be empty',
    }),
});

const updateReferenceValidator = Joi.object({
  name: Joi.string().min(2).max(100).optional().messages({
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name cannot exceed 100 characters',
    'string.empty': 'Name cannot be empty',
  }),
  mobile_no: Joi.string()
    .pattern(/^[+]?[\d\s\-()]+$/)
    .min(10)
    .max(15)
    .allow('', null)
    .optional()
    .messages({
      'string.pattern.base': 'Please provide a valid mobile number',
      'string.min': 'Mobile number must be at least 10 characters long',
      'string.max': 'Mobile number cannot exceed 15 characters',
    }),
  category: Joi.string()
    .valid(...Object.values(REFERENCE_CATEGORIES))
    .optional()
    .messages({
      'any.only': `Category must be one of: ${Object.values(REFERENCE_CATEGORIES).join(', ')}`,
      'string.empty': 'Category cannot be empty',
    }),
})
  .min(1)
  .messages({
    'object.min': 'At least one field must be provided for update',
  });

const getReferencesValidator = Joi.object({
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
  category: Joi.string()
    .valid(...Object.values(REFERENCE_CATEGORIES))
    .optional()
    .messages({
      'any.only': `Category must be one of: ${Object.values(REFERENCE_CATEGORIES).join(', ')}`,
    }),
  search: Joi.string().max(100).optional().messages({
    'string.max': 'Search term cannot exceed 100 characters',
  }),
});

const referenceIdValidator = Joi.object({
  id: Joi.string().uuid().required().messages({
    'string.guid': 'Invalid reference ID format',
    'any.required': 'Reference ID is required',
    'string.empty': 'Reference ID cannot be empty',
  }),
});

module.exports = {
  createReferenceValidator,
  updateReferenceValidator,
  getReferencesValidator,
  referenceIdValidator,
};
