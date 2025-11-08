const { User } = require('../models');
const { Op } = require('sequelize');
const { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES, PAGINATION } = require('../utils/constants');

/**
 * Create a new user (Admin only)
 */
const createUser = async (req, res) => {
  try {
    const { email, user_name, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: ERROR_MESSAGES.USER_ALREADY_EXISTS,
      });
    }

    // Create new user
    const newUser = await User.create({
      email: email.toLowerCase(),
      user_name,
      password,
      role,
    });

    // Return user data without password
    const userData = newUser.toJSON();

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: SUCCESS_MESSAGES.USER_CREATED,
      data: {
        user: userData,
      },
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      ...(process.env.NODE_ENV === 'development' && { error: error.message }),
    });
  }
};

/**
 * Get all users with pagination (Admin only)
 */
const getUsers = async (req, res) => {
  try {
    // Use validated values with fallback to constants
    const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
    const limit = parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT;
    const { name } = req.query;

    // Ensure values are valid numbers
    const validPage = Math.max(1, page);
    const validLimit = Math.min(Math.max(1, limit), PAGINATION.MAX_LIMIT);

    const offset = (validPage - 1) * validLimit;

    // Build where clause for filtering
    const whereClause = {};
    if (name) {
      whereClause.user_name = {
        [Op.iLike]: `%${name}%`,
      };
    }

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      limit: validLimit,
      offset,
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['password'] }, // Exclude password from results
    });

    const totalPages = Math.ceil(count / validLimit);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.USERS_RETRIEVED,
      data: {
        users,
        pagination: {
          page: validPage,
          limit: validLimit,
          total: count,
          pages: totalPages,
          hasNext: validPage < totalPages,
          hasPrev: validPage > 1,
        },
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      ...(process.env.NODE_ENV === 'development' && { error: error.message }),
    });
  }
};

/**
 * Get user by ID (Admin only)
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] }, // Exclude password from results
    });

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.USER_NOT_FOUND,
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.USER_RETRIEVED,
      data: {
        user,
      },
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      ...(process.env.NODE_ENV === 'development' && { error: error.message }),
    });
  }
};

/**
 * Update user (Admin only)
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Find user
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.USER_NOT_FOUND,
      });
    }

    // If email is being updated, check if it's already taken
    if (updateData.email && updateData.email.toLowerCase() !== user.email) {
      const existingUser = await User.findOne({
        where: {
          email: updateData.email.toLowerCase(),
          id: { [Op.ne]: id }, // Exclude current user
        },
      });

      if (existingUser) {
        return res.status(HTTP_STATUS.CONFLICT).json({
          success: false,
          message: ERROR_MESSAGES.USER_ALREADY_EXISTS,
        });
      }
    }

    // Normalize email if provided
    if (updateData.email) {
      updateData.email = updateData.email.toLowerCase();
    }

    // Handle password update - remove empty passwords to keep current password
    if (
      updateData.password !== undefined &&
      (updateData.password === '' || updateData.password === null)
    ) {
      delete updateData.password;
    }

    // Update user
    await user.update(updateData);

    // Return updated user data without password
    const userData = user.toJSON();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.USER_UPDATED,
      data: {
        user: userData,
      },
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      ...(process.env.NODE_ENV === 'development' && { error: error.message }),
    });
  }
};

/**
 * Delete user (Admin only)
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user.id;

    // Check if user is trying to delete themselves
    if (id === currentUserId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: ERROR_MESSAGES.CANNOT_DELETE_SELF,
      });
    }

    // Find user
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.USER_NOT_FOUND,
      });
    }

    // Delete user
    await user.destroy();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.USER_DELETED,
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      ...(process.env.NODE_ENV === 'development' && { error: error.message }),
    });
  }
};

/**
 * Change password (Admin only)
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Find the current user
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.USER_NOT_FOUND,
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: ERROR_MESSAGES.INCORRECT_CURRENT_PASSWORD,
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.PASSWORD_CHANGED,
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      ...(process.env.NODE_ENV === 'development' && { error: error.message }),
    });
  }
};

module.exports = {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  changePassword,
};
