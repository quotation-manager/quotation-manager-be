const { HTTP_STATUS, ERROR_MESSAGES } = require('../utils/constants');

/**
 * Validation middleware factory
 * @param {Object} schema - Joi validation schema
 * @param {string} source - Source of data to validate ('body', 'params', 'query')
 * @returns {Function} Express middleware function
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const dataToValidate = req[source];

    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false, // Collect all validation errors
      allowUnknown: false, // Don't allow unknown fields
      stripUnknown: true, // Remove unknown fields
      convert: true, // Convert values to the specified type
      presence: 'optional', // Allow optional fields
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: ERROR_MESSAGES.VALIDATION_ERROR,
        errors: errorDetails,
      });
    }

    // Replace the original data with validated data
    req[source] = value;
    next();
  };
};

/**
 * Validate request body
 * @param {Object} schema - Joi validation schema
 * @returns {Function} Express middleware function
 */
const validateBody = schema => validate(schema, 'body');

/**
 * Validate request params
 * @param {Object} schema - Joi validation schema
 * @returns {Function} Express middleware function
 */
const validateParams = schema => validate(schema, 'params');

/**
 * Validate request query
 * @param {Object} schema - Joi validation schema
 * @returns {Function} Express middleware function
 */
const validateQuery = schema => validate(schema, 'query');

module.exports = {
  validate,
  validateBody,
  validateParams,
  validateQuery,
};
