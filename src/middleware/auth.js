const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { HTTP_STATUS, ERROR_MESSAGES, JWT_CONFIG, USER_ROLES } = require('../utils/constants');

/**
 * Authentication middleware - Verifies JWT token
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.TOKEN_REQUIRED,
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const decoded = jwt.verify(token, JWT_CONFIG.SECRET);

      // Find the user
      const user = await User.findByPk(decoded.userId);

      if (!user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: ERROR_MESSAGES.INVALID_TOKEN,
        });
      }

      // Attach user to request object
      req.user = user;
      next();
    } catch (jwtError) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.INVALID_TOKEN,
      });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
    });
  }
};

/**
 * Authorization middleware factory - Checks user roles
 * @param {Array} allowedRoles - Array of allowed user roles
 * @returns {Function} Express middleware function
 */
const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED_ACCESS,
      });
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: ERROR_MESSAGES.ADMIN_ACCESS_REQUIRED,
      });
    }

    next();
  };
};

/**
 * Admin only authorization middleware
 */
const requireAdmin = authorize([USER_ROLES.ADMIN]);

/**
 * Admin or Employee authorization middleware
 */
const requireAuth = authorize([USER_ROLES.ADMIN, USER_ROLES.EMPLOYEE]);

module.exports = {
  authenticate,
  authorize,
  requireAdmin,
  requireAuth,
};
