const Joi = require('joi');
const { PAGINATION } = require('../utils/constants');

/**
 * Validation schema for creating a location
 */
const createLocationValidator = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Location name is required',
    'string.min': 'Location name must be at least 2 characters long',
    'string.max': 'Location name cannot exceed 100 characters',
    'any.required': 'Location name is required',
  }),
});

/**
 * Validation schema for updating a location
 */
const updateLocationValidator = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Location name is required',
    'string.min': 'Location name must be at least 2 characters long',
    'string.max': 'Location name cannot exceed 100 characters',
    'any.required': 'Location name is required',
  }),
});

/**
 * Validation schema for getting locations with pagination and search
 */
const getLocationsValidator = Joi.object({
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
  name: Joi.string().max(100).optional().allow('').messages({
    'string.max': 'Name filter cannot exceed 100 characters',
  }),
});

/**
 * Validation schema for location ID parameter
 */
const locationIdValidator = Joi.object({
  id: Joi.string().uuid().required().messages({
    'string.guid': 'Location ID must be a valid UUID',
    'any.required': 'Location ID is required',
  }),
});

module.exports = {
  createLocationValidator,
  updateLocationValidator,
  getLocationsValidator,
  locationIdValidator,
};
