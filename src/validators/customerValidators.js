const Joi = require('joi');
const { PAGINATION } = require('../utils/constants');

const createCustomerValidator = Joi.object({
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
    .required()
    .messages({
      'string.pattern.base': 'Please provide a valid mobile number',
      'string.min': 'Mobile number must be at least 10 characters long',
      'string.max': 'Mobile number cannot exceed 15 characters',
      'any.required': 'Mobile number is required',
      'string.empty': 'Mobile number cannot be empty',
    }),
  address: Joi.string().max(500).optional().allow('', null).messages({
    'string.max': 'Address cannot exceed 500 characters',
  }),
  reference_id: Joi.string().uuid().optional().allow('', null).messages({
    'string.guid': 'Reference ID must be a valid UUID',
  }),
  gst_number: Joi.string().max(255).optional().allow('', null).messages({
    'string.max': 'GST number cannot exceed 255 characters',
  }),
});

const updateCustomerValidator = Joi.object({
  name: Joi.string().min(2).max(100).optional().messages({
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name cannot exceed 100 characters',
    'string.empty': 'Name cannot be empty',
  }),
  mobile_no: Joi.string()
    .pattern(/^[+]?[\d\s\-()]+$/)
    .min(10)
    .max(15)
    .optional()
    .messages({
      'string.pattern.base': 'Please provide a valid mobile number',
      'string.min': 'Mobile number must be at least 10 characters long',
      'string.max': 'Mobile number cannot exceed 15 characters',
      'string.empty': 'Mobile number cannot be empty',
    }),
  address: Joi.string().max(500).optional().allow('', null).messages({
    'string.max': 'Address cannot exceed 500 characters',
  }),
  reference_id: Joi.string().uuid().optional().allow(null).messages({
    'string.guid': 'Reference ID must be a valid UUID',
  }),
  gst_number: Joi.string().max(255).optional().allow('', null).messages({
    'string.max': 'GST number cannot exceed 255 characters',
  }),
})
  .min(1)
  .messages({
    'object.min': 'At least one field must be provided for update',
  });

const getCustomersValidator = Joi.object({
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
  reference_id: Joi.string().uuid().optional().allow('', null).messages({
    'string.guid': 'Reference ID must be a valid UUID',
  }),
  search: Joi.string().max(100).optional().messages({
    'string.max': 'Search term cannot exceed 100 characters',
  }),
});

const customerIdValidator = Joi.object({
  id: Joi.string().uuid().required().messages({
    'string.guid': 'Invalid customer ID format',
    'any.required': 'Customer ID is required',
    'string.empty': 'Customer ID cannot be empty',
  }),
});

module.exports = {
  createCustomerValidator,
  updateCustomerValidator,
  getCustomersValidator,
  customerIdValidator,
};
