const { Product, Item } = require('../models');
const {
  HTTP_STATUS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  PAGINATION,
  PRODUCT_UNITS,
} = require('../utils/constants');
const { Op } = require('sequelize');

/**
 * Create a new product
 */
const createProduct = async (req, res) => {
  try {
    const { name, description, unit } = req.body;

    // Create new product
    const newProduct = await Product.create({
      name,
      description,
      unit,
    });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Product created successfully',
      data: {
        product: newProduct,
      },
    });
  } catch (error) {
    console.error('Create product error:', error);

    // Handle unique constraint violation
    if (error.name === 'SequelizeUniqueConstraintError' && error.fields && error.fields.name) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: 'Product with this name already exists',
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
 * Get all products with pagination and filtering
 */
const getProducts = async (req, res) => {
  try {
    // Use validated values with fallback to constants
    const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
    const limit = parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT;
    const { unit, name } = req.query;

    // Ensure values are valid numbers
    const validPage = Math.max(1, page);
    const validLimit = Math.min(Math.max(1, limit), PAGINATION.MAX_LIMIT);

    const offset = (validPage - 1) * validLimit;

    // Build where clause for filtering
    const whereClause = {};
    if (unit) {
      whereClause.unit = unit;
    }
    if (name && name.trim() !== '') {
      whereClause.name = {
        [Op.iLike]: `%${name}%`,
      };
    }

    const { count, rows: products } = await Product.findAndCountAll({
      where: whereClause,
      limit: validLimit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    const totalPages = Math.ceil(count / validLimit);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Products retrieved successfully',
      data: {
        products,
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
    console.error('Get products error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      ...(process.env.NODE_ENV === 'development' && { error: error.message }),
    });
  }
};

/**
 * Get product by ID
 */
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Product retrieved successfully',
      data: {
        product,
      },
    });
  } catch (error) {
    console.error('Get product by ID error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      ...(process.env.NODE_ENV === 'development' && { error: error.message }),
    });
  }
};

/**
 * Update product
 */
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Find product
    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Update product
    await product.update(updateData);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Product updated successfully',
      data: {
        product,
      },
    });
  } catch (error) {
    console.error('Update product error:', error);

    // Handle unique constraint violation
    if (error.name === 'SequelizeUniqueConstraintError' && error.fields && error.fields.name) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: 'Product with this name already exists',
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
 * Delete product (Admin only - check for dependent items)
 */
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Find product and count associated items
    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Check if product is used in any items
    const itemCount = await Item.count({
      where: {
        product_id: id,
      },
    });

    if (itemCount > 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Cannot delete product. It is used in quotation items',
        data: {
          itemCount: itemCount,
        },
      });
    }

    // Delete product
    await product.destroy();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      ...(process.env.NODE_ENV === 'development' && { error: error.message }),
    });
  }
};

/**
 * Get all available product units
 */
const getProductUnits = async (req, res) => {
  try {
    const units = Object.values(PRODUCT_UNITS);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Product units retrieved successfully',
      data: {
        units,
        count: units.length,
      },
    });
  } catch (error) {
    console.error('Get product units error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      ...(process.env.NODE_ENV === 'development' && { error: error.message }),
    });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductUnits,
};
