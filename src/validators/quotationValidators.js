const Joi = require('joi');
const {
  PAGINATION,
  PRODUCT_UNITS,
  DISCOUNT_TYPES,
  PRICE_TYPES,
  IMAGE_CONFIG,
} = require('../utils/constants');

/**
 * Validation schema for item creation/update
 */
const itemSchema = Joi.object({
  product_id: Joi.string().uuid().required().messages({
    'string.guid': 'Product ID must be a valid UUID',
    'any.required': 'Product ID is required',
  }),
  description: Joi.string().max(1000).optional().allow(null).empty('').default(null).messages({
    'string.max': 'Description cannot exceed 1000 characters',
  }),
  rate: Joi.number().positive().precision(2).required().messages({
    'number.base': 'Rate must be a valid number',
    'number.positive': 'Rate must be a positive number',
    'number.precision': 'Rate must have maximum 2 decimal places',
    'any.required': 'Rate is required',
  }),
  discount: Joi.number()
    .positive()
    .precision(2)
    .optional()
    .allow(null)
    .empty('')
    .default(null)
    .messages({
      'number.base': 'Discount must be a valid number',
      'number.positive': 'Discount must be a positive number',
      'number.precision': 'Discount must have maximum 2 decimal places',
    }),
  discount_type: Joi.string()
    .valid(...Object.values(DISCOUNT_TYPES))
    .optional()
    .allow(null)
    .empty('')
    .default(null)
    .messages({
      'any.only': `Discount type must be one of: ${Object.values(DISCOUNT_TYPES).join(', ')}`,
    }),
  unit: Joi.string()
    .valid(...Object.values(PRODUCT_UNITS))
    .optional()
    .allow(null)
    .empty('')
    .default(null)
    .messages({
      'any.only': `Unit must be one of: ${Object.values(PRODUCT_UNITS).join(', ')}`,
    }),
  location_id: Joi.string().uuid().optional().allow(null).empty('').default(null).messages({
    'string.guid': 'Location ID must be a valid UUID',
  }),
  quantity: Joi.number().integer().positive().empty('').empty(null).default(1).messages({
    'number.base': 'Quantity must be a valid number',
    'number.integer': 'Quantity must be an integer',
    'number.positive': 'Quantity must be a positive number',
  }),
});

/**
 * Validation schema for creating a quotation
 */
const createQuotationValidator = Joi.object({
  quotation_date: Joi.date().required().messages({
    'date.base': 'Quotation date must be a valid date',
    'any.required': 'Quotation date is required',
  }),
  customer_id: Joi.string().uuid().required().messages({
    'string.guid': 'Customer ID must be a valid UUID',
    'any.required': 'Customer ID is required',
  }),
  last_shared_date: Joi.date().optional().allow(null).empty('').default(null).messages({
    'date.base': 'Last shared date must be a valid date',
  }),
  remarks: Joi.string().max(1000).optional().allow(null).empty('').default(null).messages({
    'string.max': 'Remarks cannot exceed 1000 characters',
  }),
  price_type: Joi.string()
    .valid(...Object.values(PRICE_TYPES))
    .empty('')
    .empty(null)
    .default(PRICE_TYPES.INCLUSIVE_TAX)
    .messages({
      'any.only': `Price type must be one of: ${Object.values(PRICE_TYPES).join(', ')}`,
    }),
  items: Joi.alternatives()
    .try(
      Joi.array().items(itemSchema).min(1).required(),
      Joi.string()
        .custom((value, helpers) => {
          try {
            const parsed = JSON.parse(value);
            if (!Array.isArray(parsed)) {
              return helpers.error('any.invalid');
            }
            return parsed;
          } catch (error) {
            return helpers.error('any.invalid');
          }
        })
        .messages({
          'any.invalid': 'Items must be a valid JSON array string',
        })
    )
    .messages({
      'array.min': 'At least one item is required',
      'any.required': 'Items are required',
    }),
});

/**
 * Validation schema for updating a quotation
 */
const updateQuotationValidator = Joi.object({
  quotation_date: Joi.date().optional().messages({
    'date.base': 'Quotation date must be a valid date',
  }),
  customer_id: Joi.string().uuid().optional().messages({
    'string.guid': 'Customer ID must be a valid UUID',
  }),
  last_shared_date: Joi.date().optional().allow(null, '').messages({
    'date.base': 'Last shared date must be a valid date',
  }),
  remarks: Joi.string().max(1000).optional().allow(null, '').messages({
    'string.max': 'Remarks cannot exceed 1000 characters',
  }),
  price_type: Joi.string()
    .valid(...Object.values(PRICE_TYPES))
    .optional()
    .allow('', null)
    .messages({
      'any.only': `Price type must be one of: ${Object.values(PRICE_TYPES).join(', ')}`,
    }),
  items: Joi.alternatives()
    .try(
      Joi.array().items(itemSchema).min(1).optional(),
      Joi.string()
        .custom((value, helpers) => {
          try {
            const parsed = JSON.parse(value);
            if (!Array.isArray(parsed)) {
              return helpers.error('any.invalid');
            }
            return parsed;
          } catch (error) {
            return helpers.error('any.invalid');
          }
        })
        .messages({
          'any.invalid': 'Items must be a valid JSON array string',
        })
    )
    .messages({
      'array.min': 'At least one item is required',
    }),
});

/**
 * Validation schema for getting quotations with pagination and filtering
 */
const getQuotationsValidator = Joi.object({
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
  customer_id: Joi.string().uuid().optional().messages({
    'string.guid': 'Customer ID must be a valid UUID',
  }),
  reference_id: Joi.string().uuid().optional().messages({
    'string.guid': 'Reference ID must be a valid UUID',
  }),
  start_date: Joi.date().optional().messages({
    'date.base': 'Start date must be a valid date',
  }),
  end_date: Joi.date().optional().messages({
    'date.base': 'End date must be a valid date',
  }),
});

/**
 * Validation schema for quotation ID parameter
 */
const quotationIdValidator = Joi.object({
  id: Joi.string().uuid().required().messages({
    'string.guid': 'Quotation ID must be a valid UUID',
    'any.required': 'Quotation ID is required',
  }),
});

/**
 * Validation schema for updating last shared date
 */
const updateLastSharedDateValidator = Joi.object({}).strict();

module.exports = {
  createQuotationValidator,
  updateQuotationValidator,
  getQuotationsValidator,
  quotationIdValidator,
  updateLastSharedDateValidator,
  itemSchema,
};
