const { Reference, Customer } = require('../models');
const { Op } = require('sequelize');
const {
  HTTP_STATUS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  PAGINATION,
  REFERENCE_CATEGORIES,
} = require('../utils/constants');

/**
 * Create a new reference
 */
const createReference = async (req, res) => {
  try {
    const { name, mobile_no, category } = req.body;

    // Convert empty mobile_no to null for consistent unique constraint behavior
    const mobileNumber = mobile_no === '' ? null : mobile_no;

    // Create new reference
    const newReference = await Reference.create({
      name,
      mobile_no: mobileNumber,
      category,
    });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Reference created successfully',
      data: {
        reference: newReference,
      },
    });
  } catch (error) {
    console.error('Create reference error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      ...(process.env.NODE_ENV === 'development' && { error: error.message }),
    });
  }
};

/**
 * Get all references with pagination and filtering
 */
const getReferences = async (req, res) => {
  try {
    // Use validated values with fallback to constants
    const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
    const limit = parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT;
    const { category, search } = req.query;

    // Ensure values are valid numbers
    const validPage = Math.max(1, page);
    const validLimit = Math.min(Math.max(1, limit), PAGINATION.MAX_LIMIT);

    const offset = (validPage - 1) * validLimit;

    // Build where clause for filtering
    const whereClause = {};
    if (category) {
      whereClause.category = category;
    }
    if (search) {
      whereClause[Op.or] = [
        {
          name: {
            [Op.iLike]: `%${search}%`,
          },
        },
        {
          mobile_no: {
            [Op.iLike]: `%${search}%`,
          },
        },
      ];
    }

    const { count, rows: references } = await Reference.findAndCountAll({
      where: whereClause,
      limit: validLimit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Customer,
          as: 'customers',
          attributes: ['id', 'name'],
          required: false,
        },
      ],
    });

    const totalPages = Math.ceil(count / validLimit);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'References retrieved successfully',
      data: {
        references,
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
    console.error('Get references error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      ...(process.env.NODE_ENV === 'development' && { error: error.message }),
    });
  }
};

/**
 * Get reference by ID
 */
const getReferenceById = async (req, res) => {
  try {
    const { id } = req.params;

    const reference = await Reference.findByPk(id, {
      include: [
        {
          model: Customer,
          as: 'customers',
          attributes: ['id', 'name', 'mobile_no'],
          required: false,
        },
      ],
    });

    if (!reference) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Reference not found',
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Reference retrieved successfully',
      data: {
        reference,
      },
    });
  } catch (error) {
    console.error('Get reference by ID error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      ...(process.env.NODE_ENV === 'development' && { error: error.message }),
    });
  }
};

/**
 * Update reference
 */
const updateReference = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Convert empty mobile_no to null for consistent unique constraint behavior
    if (updateData.mobile_no !== undefined && updateData.mobile_no === '') {
      updateData.mobile_no = null;
    }

    // Find reference
    const reference = await Reference.findByPk(id);

    if (!reference) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Reference not found',
      });
    }

    // Update reference
    await reference.update(updateData);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Reference updated successfully',
      data: {
        reference,
      },
    });
  } catch (error) {
    console.error('Update reference error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      ...(process.env.NODE_ENV === 'development' && { error: error.message }),
    });
  }
};

/**
 * Delete reference (Admin only - check for dependent customers)
 */
const deleteReference = async (req, res) => {
  try {
    const { id } = req.params;

    // Find reference
    const reference = await Reference.findByPk(id, {
      include: [
        {
          model: Customer,
          as: 'customers',
          attributes: ['id'],
          required: false,
        },
      ],
    });

    if (!reference) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Reference not found',
      });
    }

    // Check if reference has associated customers
    if (reference.customers && reference.customers.length > 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Cannot delete reference. It has associated customers',
        data: {
          customerCount: reference.customers.length,
        },
      });
    }

    // Delete reference
    await reference.destroy();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Reference deleted successfully',
    });
  } catch (error) {
    console.error('Delete reference error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      ...(process.env.NODE_ENV === 'development' && { error: error.message }),
    });
  }
};

/**
 * Get all available reference categories
 */
const getReferenceCategories = async (req, res) => {
  try {
    const categories = Object.values(REFERENCE_CATEGORIES);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Reference categories retrieved successfully',
      data: {
        categories,
        count: categories.length,
      },
    });
  } catch (error) {
    console.error('Get reference categories error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      ...(process.env.NODE_ENV === 'development' && { error: error.message }),
    });
  }
};

module.exports = {
  createReference,
  getReferences,
  getReferenceById,
  updateReference,
  deleteReference,
  getReferenceCategories,
};
