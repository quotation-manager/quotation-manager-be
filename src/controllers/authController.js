const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES, JWT_CONFIG } = require('../utils/constants');

/**
 * Generate JWT token for user
 * @param {Object} user - User object
 * @returns {string} JWT token
 */
const generateToken = user => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_CONFIG.SECRET,
    {
      expiresIn: JWT_CONFIG.EXPIRES_IN,
    }
  );
};

/**
 * Login user
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.INVALID_CREDENTIALS,
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.INVALID_CREDENTIALS,
      });
    }

    // Generate token
    const token = generateToken(user);

    // Return user data and token
    const userData = user.toJSON(); // This will exclude password

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.LOGIN_SUCCESSFUL,
      data: {
        user: userData,
        token,
        tokenType: 'Bearer',
        expiresIn: JWT_CONFIG.EXPIRES_IN,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      ...(process.env.NODE_ENV === 'development' && { error: error.message }),
    });
  }
};

module.exports = {
  login,
};
