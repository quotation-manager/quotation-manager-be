const Joi = require('joi');
const { PRODUCT_UNITS, PAGINATION } = require('../utils/constants');

const createProductValidator = Joi.object({
  name: Joi.string().min(2).max(200).required().messages({
    'string.min': 'Product name must be at least 2 characters long',
    'string.max': 'Product name cannot exceed 200 characters',
    'any.required': 'Product name is required',
    'string.empty': 'Product name cannot be empty',
  }),
  description: Joi.string().max(1000).optional().allow('', null).messages({
    'string.max': 'Description cannot exceed 1000 characters',
  }),
  unit: Joi.string()
    .valid(...Object.values(PRODUCT_UNITS))
    .required()
    .messages({
      'any.only': `Unit must be one of: ${Object.values(PRODUCT_UNITS).join(', ')}`,
      'any.required': 'Unit is required',
      'string.empty': 'Unit cannot be empty',
    }),
});

const updateProductValidator = Joi.object({
  name: Joi.string().min(2).max(200).optional().messages({
    'string.min': 'Product name must be at least 2 characters long',
    'string.max': 'Product name cannot exceed 200 characters',
    'string.empty': 'Product name cannot be empty',
  }),
  description: Joi.string().max(1000).optional().allow('', null).messages({
    'string.max': 'Description cannot exceed 1000 characters',
  }),
  unit: Joi.string()
    .valid(...Object.values(PRODUCT_UNITS))
    .optional()
    .messages({
      'any.only': `Unit must be one of: ${Object.values(PRODUCT_UNITS).join(', ')}`,
      'string.empty': 'Unit cannot be empty',
    }),
})
  .min(1)
  .messages({
    'object.min': 'At least one field must be provided for update',
  });

const getProductsValidator = Joi.object({
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
  unit: Joi.string()
    .valid(...Object.values(PRODUCT_UNITS))
    .optional()
    .messages({
      'any.only': `Unit must be one of: ${Object.values(PRODUCT_UNITS).join(', ')}`,
    }),
  name: Joi.string().max(200).optional().allow('').messages({
    'string.max': 'Name filter cannot exceed 200 characters',
  }),
});

const productIdValidator = Joi.object({
  id: Joi.string().uuid().required().messages({
    'string.guid': 'Invalid product ID format',
    'any.required': 'Product ID is required',
    'string.empty': 'Product ID cannot be empty',
  }),
});

module.exports = {
  createProductValidator,
  updateProductValidator,
  getProductsValidator,
  productIdValidator,
};
