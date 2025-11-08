const Joi = require('joi');

/**
 * Validator for seed test data request
 */
const seedDataValidator = Joi.object({
  count: Joi.number().integer().min(1).max(1000).required().messages({
    'number.base': 'Count must be a number',
    'number.integer': 'Count must be an integer',
    'number.min': 'Count must be at least 1',
    'number.max': 'Count cannot exceed 1000',
    'any.required': 'Count is required',
  }),
});

module.exports = {
  seedDataValidator,
};
