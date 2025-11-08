const {
  Quotation,
  Item,
  Customer,
  Product,
  Location,
  Reference,
  User,
  sequelize,
} = require('../models');
const { Op } = require('sequelize');
const {
  HTTP_STATUS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  PAGINATION,
  QUOTATION_CONFIG,
  IMAGE_CONFIG,
} = require('../utils/constants');
const {
  uploadMultipleImages,
  uploadMultipleImagesForEdit,
  deleteMultipleImages,
} = require('../services/s3Service');
const { generateAndUploadQuotationPDF, deleteQuotationPDF } = require('../services/pdfService');

/**
 * Create a new quotation with items
 */
const createQuotation = async (req, res) => {
  try {
    const {
      quotation_date,
      customer_id,
      last_shared_date,
      remarks,
      price_type,
      items: itemsData,
    } = req.body;
    const files = req.files || [];

    // Parse items if it's a string
    const items = typeof itemsData === 'string' ? JSON.parse(itemsData) : itemsData;

    // Verify customer exists
    const customer = await Customer.findByPk(customer_id);
    if (!customer) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Customer not found',
      });
    }

    // Verify all products exist and get their units
    const productIds = items.map(item => item.product_id);
    const products = await Product.findAll({
      where: { id: productIds },
      attributes: ['id', 'unit'],
    });

    const missingProducts = productIds.filter(id => !products.some(product => product.id === id));
    if (missingProducts.length > 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'One or more products not found',
      });
    }

    // Create a map of product units for easy lookup
    const productUnitsMap = {};
    products.forEach(product => {
      productUnitsMap[product.id] = product.unit;
    });

    // Start transaction
    const result = await sequelize.transaction(async t => {
      // Create quotation
      const quotation = await Quotation.create(
        {
          quotation_date,
          customer_id,
          last_shared_date,
          remarks,
          price_type,
          created_by: req.user.id,
        },
        { transaction: t }
      );

      // Process items with images
      const processedItems = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        // Try different field name formats for files
        let itemFiles = files.filter(file => file.fieldname === `items[${i}][images]`);
        if (itemFiles.length === 0) {
          itemFiles = files.filter(file => file.fieldname === `item_images_${i}`);
        }
        if (itemFiles.length === 0) {
          itemFiles = files.filter(file => file.fieldname === `images_${i}`);
        }
        if (itemFiles.length === 0) {
          itemFiles = files.filter(file => file.fieldname === `item_${i}_images`);
        }
        if (itemFiles.length === 0) {
          itemFiles = files.filter(file => file.fieldname === `files_${i}`);
        }

        // Validate number of images per item
        if (itemFiles.length > IMAGE_CONFIG.MAX_IMAGES_PER_ITEM) {
          throw new Error(
            `Item ${i + 1}: Maximum ${IMAGE_CONFIG.MAX_IMAGES_PER_ITEM} image allowed per item`
          );
        }

        // Upload images for this item
        let imagePaths = [];
        if (itemFiles.length > 0) {
          imagePaths = await uploadMultipleImages(itemFiles, quotation.id);
        }

        // Use product unit if item unit is not provided
        const unit = item.unit || productUnitsMap[item.product_id];

        // Create item
        const createdItem = await Item.create(
          {
            quotation_id: quotation.id,
            product_id: item.product_id,
            description: item.description,
            rate: item.rate,
            discount: item.discount,
            discount_type: item.discount_type,
            unit,
            images: imagePaths,
            location_id: item.location_id,
            quantity: item.quantity || 1,
          },
          { transaction: t }
        );

        processedItems.push(createdItem);
      }

      return { quotation, items: processedItems };
    });

    // Fetch the created quotation with associations
    const createdQuotation = await Quotation.findByPk(result.quotation.id, {
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'mobile_no', 'address', 'gst_number'],
          include: [
            {
              model: Reference,
              as: 'reference',
              attributes: ['id', 'name', 'category', 'mobile_no'],
            },
          ],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'user_name', 'email'],
        },
        {
          model: Item,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'description', 'unit'],
            },
            {
              model: Location,
              as: 'location',
              attributes: ['id', 'name'],
            },
          ],
        },
      ],
      order: [[{ model: Item, as: 'items' }, 'createdAt', 'ASC']],
    });

    // Generate and upload PDF
    try {
      const pdfPath = await generateAndUploadQuotationPDF(createdQuotation, createdQuotation.id);

      // Update quotation with PDF path
      await createdQuotation.update({ pdf_path: pdfPath });

      // Fetch updated quotation
      const updatedQuotation = await Quotation.findByPk(createdQuotation.id, {
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: ['id', 'name', 'mobile_no', 'address', 'gst_number'],
            include: [
              {
                model: Reference,
                as: 'reference',
                attributes: ['id', 'name', 'category', 'mobile_no'],
              },
            ],
          },
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'user_name', 'email'],
          },
          {
            model: Item,
            as: 'items',
            include: [
              {
                model: Product,
                as: 'product',
                attributes: ['id', 'name', 'description', 'unit'],
              },
              {
                model: Location,
                as: 'location',
                attributes: ['id', 'name'],
              },
            ],
          },
        ],
        order: [[{ model: Item, as: 'items' }, 'createdAt', 'ASC']],
      });

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Quotation created successfully with PDF',
        data: {
          quotation: updatedQuotation,
        },
      });
    } catch (pdfError) {
      console.error('PDF generation failed:', pdfError);

      // Still return success but without PDF
      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Quotation created successfully (PDF generation failed)',
        data: {
          quotation: createdQuotation,
        },
      });
    }
  } catch (error) {
    console.error('Create quotation error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      ...(process.env.NODE_ENV === 'development' && { error: error.message }),
    });
  }
};

/**
 * Get all quotations with pagination and filtering
 */
const getQuotations = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
    const limit = parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT;
    const { customer_id, reference_id, start_date, end_date } = req.query;

    // Ensure values are valid numbers
    const validPage = Math.max(1, page);
    const validLimit = Math.min(Math.max(1, limit), PAGINATION.MAX_LIMIT);
    const offset = (validPage - 1) * validLimit;

    // Build where clause for filtering
    const whereClause = {};
    if (customer_id) {
      whereClause.customer_id = customer_id;
    }
    if (start_date || end_date) {
      whereClause.quotation_date = {};
      if (start_date) {
        whereClause.quotation_date[Op.gte] = new Date(start_date);
      }
      if (end_date) {
        whereClause.quotation_date[Op.lte] = new Date(end_date);
      }
    }

    // Build include clause with conditional reference filtering
    const includeClause = [
      {
        model: Customer,
        as: 'customer',
        attributes: ['id', 'name', 'mobile_no'],
        ...(reference_id && {
          where: { reference_id: reference_id },
        }),
      },
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'user_name', 'email'],
      },
      {
        model: Item,
        as: 'items',
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'description', 'unit'],
          },
          {
            model: Location,
            as: 'location',
            attributes: ['id', 'name'],
          },
        ],
      },
    ];

    const { count, rows: quotations } = await Quotation.findAndCountAll({
      where: whereClause,
      limit: validLimit,
      offset,
      order: [['createdAt', 'DESC']],
      // Avoid inflated counts caused by JOINs from hasMany includes
      distinct: true,
      col: 'id',
      include: includeClause,
    });

    const totalPages = Math.ceil(count / validLimit);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Quotations retrieved successfully',
      data: {
        quotations,
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
    console.error('Get quotations error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      ...(process.env.NODE_ENV === 'development' && { error: error.message }),
    });
  }
};

/**
 * Get quotation by ID
 */
const getQuotationById = async (req, res) => {
  try {
    const { id } = req.params;

    const quotation = await Quotation.findByPk(id, {
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'mobile_no', 'address', 'gst_number'],
          include: [
            {
              model: Reference,
              as: 'reference',
              attributes: ['id', 'name', 'category', 'mobile_no'],
            },
          ],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'user_name', 'email'],
        },
        {
          model: Item,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'description', 'unit'],
            },
            {
              model: Location,
              as: 'location',
              attributes: ['id', 'name'],
            },
          ],
        },
      ],
      order: [[{ model: Item, as: 'items' }, 'createdAt', 'ASC']],
    });

    if (!quotation) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Quotation not found',
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Quotation retrieved successfully',
      data: {
        quotation,
      },
    });
  } catch (error) {
    console.error('Get quotation by ID error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      ...(process.env.NODE_ENV === 'development' && { error: error.message }),
    });
  }
};

/**
 * Update quotation
 */
const updateQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      quotation_date,
      customer_id,
      last_shared_date,
      remarks,
      price_type,
      items: itemsData,
    } = req.body;
    const files = req.files || [];

    // Parse items if it's a string
    const items = typeof itemsData === 'string' ? JSON.parse(itemsData) : itemsData;

    // Check if quotation exists
    const existingQuotation = await Quotation.findByPk(id, {
      include: [
        {
          model: Item,
          as: 'items',
        },
      ],
    });

    if (!existingQuotation) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Quotation not found',
      });
    }

    // Verify customer exists if provided
    if (customer_id) {
      const customer = await Customer.findByPk(customer_id);
      if (!customer) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Customer not found',
        });
      }
    }

    // Start transaction for all updates
    await sequelize.transaction(async t => {
      // Update quotation data
      const updateData = {};
      if (quotation_date) updateData.quotation_date = quotation_date;
      if (customer_id) updateData.customer_id = customer_id;
      if (last_shared_date) updateData.last_shared_date = last_shared_date;
      if (remarks !== undefined) updateData.remarks = remarks;
      if (price_type) updateData.price_type = price_type;

      if (Object.keys(updateData).length > 0) {
        await existingQuotation.update(updateData, { transaction: t });
      }

      // Process items if provided
      if (items && items.length > 0) {
        // Verify products exist
        const productIds = items.map(item => item.product_id);
        const products = await Product.findAll({
          where: { id: productIds },
          attributes: ['id', 'unit'],
        });

        const missingProducts = productIds.filter(
          id => !products.some(product => product.id === id)
        );
        if (missingProducts.length > 0) {
          throw new Error('One or more products not found');
        }

        // Create a map of product units
        const productUnitsMap = {};
        products.forEach(product => {
          productUnitsMap[product.id] = product.unit;
        });

        // Delete existing items and their images
        if (existingQuotation.items && existingQuotation.items.length > 0) {
          const imagePathsToDelete = [];
          existingQuotation.items.forEach(item => {
            if (item.images && item.images.length > 0) {
              imagePathsToDelete.push(...item.images);
            }
          });
          await deleteMultipleImages(imagePathsToDelete);
          await Item.destroy({
            where: { quotation_id: id },
            transaction: t,
          });
        }

        // Create new items
        for (let i = 0; i < items.length; i++) {
          const item = items[i];

          // Try different field name formats for files
          let itemFiles = files.filter(file => file.fieldname === `items[${i}][images]`);
          if (itemFiles.length === 0) {
            itemFiles = files.filter(file => file.fieldname === `item_images_${i}`);
          }
          if (itemFiles.length === 0) {
            itemFiles = files.filter(file => file.fieldname === `images_${i}`);
          }
          if (itemFiles.length === 0) {
            itemFiles = files.filter(file => file.fieldname === `item_${i}_images`);
          }
          if (itemFiles.length === 0) {
            itemFiles = files.filter(file => file.fieldname === `files_${i}`);
          }

          // Validate number of images per item
          if (itemFiles.length > IMAGE_CONFIG.MAX_IMAGES_PER_ITEM) {
            throw new Error(
              `Item ${i + 1}: Maximum ${IMAGE_CONFIG.MAX_IMAGES_PER_ITEM} image allowed per item`
            );
          }

          // Upload images for this item (use edit function to avoid re-compressing already compressed images)
          let imagePaths = [];
          if (itemFiles.length > 0) {
            imagePaths = await uploadMultipleImagesForEdit(itemFiles, id);
          }

          // Use product unit if item unit is not provided
          const unit = item.unit || productUnitsMap[item.product_id];

          // Create item
          const createdItem = await Item.create(
            {
              quotation_id: id,
              product_id: item.product_id,
              description: item.description,
              rate: item.rate,
              discount: item.discount,
              discount_type: item.discount_type,
              unit,
              images: imagePaths,
              location_id: item.location_id,
              quantity: item.quantity || 1,
            },
            { transaction: t }
          );
        }
      }
    });

    // Fetch updated quotation
    const updatedQuotation = await Quotation.findByPk(id, {
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'mobile_no', 'address', 'gst_number'],
          include: [
            {
              model: Reference,
              as: 'reference',
              attributes: ['id', 'name', 'category', 'mobile_no'],
            },
          ],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'user_name', 'email'],
        },
        {
          model: Item,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'description', 'unit'],
            },
            {
              model: Location,
              as: 'location',
              attributes: ['id', 'name'],
            },
          ],
        },
      ],
      order: [[{ model: Item, as: 'items' }, 'createdAt', 'ASC']],
    });

    // Generate and upload new PDF
    try {
      // Delete old PDF if exists
      if (existingQuotation.pdf_path) {
        await deleteQuotationPDF(existingQuotation.pdf_path);
      }

      const pdfPath = await generateAndUploadQuotationPDF(updatedQuotation, id);

      // Update quotation with new PDF path
      await updatedQuotation.update({ pdf_path: pdfPath });

      // Fetch final updated quotation
      const finalQuotation = await Quotation.findByPk(id, {
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: ['id', 'name', 'mobile_no', 'address', 'gst_number'],
            include: [
              {
                model: Reference,
                as: 'reference',
                attributes: ['id', 'name', 'category', 'mobile_no'],
              },
            ],
          },
          {
            model: Item,
            as: 'items',
            include: [
              {
                model: Product,
                as: 'product',
                attributes: ['id', 'name', 'description', 'unit'],
              },
              {
                model: Location,
                as: 'location',
                attributes: ['id', 'name'],
              },
            ],
          },
        ],
      });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Quotation updated successfully with new PDF',
        data: {
          quotation: finalQuotation,
        },
      });
    } catch (pdfError) {
      console.error('PDF regeneration failed:', pdfError);

      // Still return success but without PDF update
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Quotation updated successfully (PDF regeneration failed)',
        data: {
          quotation: updatedQuotation,
        },
      });
    }
  } catch (error) {
    console.error('Update quotation error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      ...(process.env.NODE_ENV === 'development' && { error: error.message }),
    });
  }
};

/**
 * Delete quotation (Admin only)
 */
const deleteQuotation = async (req, res) => {
  try {
    const { id } = req.params;

    const quotation = await Quotation.findByPk(id, {
      include: [
        {
          model: Item,
          as: 'items',
        },
      ],
    });

    if (!quotation) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Quotation not found',
      });
    }

    // Delete images from S3
    const imagePathsToDelete = [];
    if (quotation.items && quotation.items.length > 0) {
      quotation.items.forEach(item => {
        if (item.images && item.images.length > 0) {
          imagePathsToDelete.push(...item.images);
        }
      });
    }

    // Delete PDF from S3 if exists
    if (quotation.pdf_path) {
      await deleteQuotationPDF(quotation.pdf_path);
    }

    // Delete quotation (items will be deleted automatically due to CASCADE)
    await quotation.destroy();

    // Delete images from S3
    await deleteMultipleImages(imagePathsToDelete);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Quotation deleted successfully',
    });
  } catch (error) {
    console.error('Delete quotation error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      ...(process.env.NODE_ENV === 'development' && { error: error.message }),
    });
  }
};

/**
 * Update last shared date
 */
const updateLastSharedDate = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch quotation
    const quotation = await Quotation.findByPk(id);

    if (!quotation) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Quotation not found',
      });
    }

    // Update last shared date
    const currentDateTime = new Date();
    await quotation.update({ last_shared_date: currentDateTime });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Last shared date updated successfully',
      data: {
        quotation: {
          id: quotation.id,
          last_shared_date: currentDateTime,
        },
      },
    });
  } catch (error) {
    console.error('Update last shared date error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      ...(process.env.NODE_ENV === 'development' && { error: error.message }),
    });
  }
};

/**
 * Regenerate PDF for quotation
 */
const regeneratePDF = async (req, res) => {
  try {
    const { id } = req.params;

    const quotation = await Quotation.findByPk(id, {
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'mobile_no', 'address', 'gst_number'],
          include: [
            {
              model: Reference,
              as: 'reference',
              attributes: ['id', 'name', 'category', 'mobile_no'],
            },
          ],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'user_name', 'email'],
        },
        {
          model: Item,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'description', 'unit'],
            },
            {
              model: Location,
              as: 'location',
              attributes: ['id', 'name'],
            },
          ],
        },
      ],
      order: [[{ model: Item, as: 'items' }, 'createdAt', 'ASC']],
    });

    if (!quotation) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Quotation not found',
      });
    }

    // Delete old PDF if exists
    if (quotation.pdf_path) {
      await deleteQuotationPDF(quotation.pdf_path);
    }

    // Generate and upload new PDF
    const pdfPath = await generateAndUploadQuotationPDF(quotation, id);

    // Update quotation with new PDF path
    await quotation.update({ pdf_path: pdfPath });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'PDF regenerated successfully',
      data: {
        quotation: {
          id: quotation.id,
          pdf_path: pdfPath,
        },
      },
    });
  } catch (error) {
    console.error('Regenerate PDF error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      ...(process.env.NODE_ENV === 'development' && { error: error.message }),
    });
  }
};

/**
 * Get public quotation details (no authentication required)
 */
const getPublicQuotation = async (req, res) => {
  try {
    const { id } = req.params;

    const quotation = await Quotation.findByPk(id, {
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'mobile_no'],
        },
        {
          model: Item,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'description', 'unit'],
            },
            {
              model: Location,
              as: 'location',
              attributes: ['id', 'name'],
            },
          ],
        },
      ],
    });

    if (!quotation) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Quotation not found',
      });
    }

    // Check if quotation has been shared
    if (!quotation.last_shared_date) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'This quotation has not been shared yet',
      });
    }

    // Check if last shared date is within the configured expiry period
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() - QUOTATION_CONFIG.PUBLIC_ACCESS_EXPIRY_MONTHS);

    if (quotation.last_shared_date < expiryDate) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'This quotation link has expired. Please contact us for a new quotation.',
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Quotation details retrieved successfully',
      data: {
        quotation,
      },
    });
  } catch (error) {
    console.error('Get public quotation error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      ...(process.env.NODE_ENV === 'development' && { error: error.message }),
    });
  }
};

module.exports = {
  createQuotation,
  getQuotations,
  getQuotationById,
  updateQuotation,
  deleteQuotation,
  updateLastSharedDate,
  regeneratePDF,
  getPublicQuotation,
};
