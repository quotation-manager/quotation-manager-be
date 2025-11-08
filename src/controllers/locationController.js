const { Location } = require('../models');
const { Op } = require('sequelize');
const { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES, PAGINATION } = require('../utils/constants');

/**
 * Create a new location
 */
const createLocation = async (req, res) => {
  try {
    const { name } = req.body;

    // Create new location
    const newLocation = await Location.create({
      name,
    });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Location created successfully',
      data: {
        location: newLocation,
      },
    });
  } catch (error) {
    console.error('Create location error:', error);

    // Handle unique constraint violation
    if (error.name === 'SequelizeUniqueConstraintError' && error.fields && error.fields.name) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: 'Location with this name already exists',
      });
    }

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      ...(process.env.NODE_ENV === 'development' && { error: error.message }),
    });
  }
};

/**
 * Get all locations with pagination and filtering
 */
const getLocations = async (req, res) => {
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
    if (name && name.trim() !== '') {
      whereClause.name = {
        [Op.iLike]: `%${name}%`,
      };
    }

    const { count, rows: locations } = await Location.findAndCountAll({
      where: whereClause,
      limit: validLimit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    const totalPages = Math.ceil(count / validLimit);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Locations retrieved successfully',
      data: {
        locations,
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
    console.error('Get locations error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      ...(process.env.NODE_ENV === 'development' && { error: error.message }),
    });
  }
};

/**
 * Get location by ID
 */
const getLocationById = async (req, res) => {
  try {
    const { id } = req.params;

    const location = await Location.findByPk(id);

    if (!location) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Location not found',
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Location retrieved successfully',
      data: {
        location,
      },
    });
  } catch (error) {
    console.error('Get location by ID error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      ...(process.env.NODE_ENV === 'development' && { error: error.message }),
    });
  }
};

/**
 * Update location
 */
const updateLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const location = await Location.findByPk(id);

    if (!location) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Location not found',
      });
    }

    // Update location
    await location.update({
      name,
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Location updated successfully',
      data: {
        location,
      },
    });
  } catch (error) {
    console.error('Update location error:', error);

    // Handle unique constraint violation
    if (error.name === 'SequelizeUniqueConstraintError' && error.fields && error.fields.name) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: 'Location with this name already exists',
      });
    }

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      ...(process.env.NODE_ENV === 'development' && { error: error.message }),
    });
  }
};

/**
 * Delete location (Admin only)
 */
const deleteLocation = async (req, res) => {
  try {
    const { id } = req.params;

    const location = await Location.findByPk(id);

    if (!location) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Location not found',
      });
    }

    // Delete location
    await location.destroy();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Location deleted successfully',
    });
  } catch (error) {
    console.error('Delete location error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      ...(process.env.NODE_ENV === 'development' && { error: error.message }),
    });
  }
};

module.exports = {
  createLocation,
  getLocations,
  getLocationById,
  updateLocation,
  deleteLocation,
};
