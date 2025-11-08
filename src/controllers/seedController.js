const fs = require('fs');
const path = require('path');
const { User, Reference, Customer, Product, Location, Quotation, Item } = require('../models');
const {
  HTTP_STATUS,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
  USER_ROLES,
  REFERENCE_CATEGORIES,
  PRODUCT_UNITS,
  PRICE_TYPES,
  DISCOUNT_TYPES,
} = require('../utils/constants');
const { uploadImage, deleteMultipleImages } = require('../services/s3Service');
const { generateAndUploadQuotationPDF, deleteQuotationPDF } = require('../services/pdfService');

/**
 * Generate test data with timestamps for differentiation
 * @param {number} count - Number of records to generate for each entity
 */
const generateTestData = count => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const adminCount = Math.max(1, Math.floor(count * 0.1)); // 10% admins, minimum 1

  return {
    users: Array.from({ length: count }, (_, i) => ({
      email: `testuser${i + 1}_${timestamp}@marutitest.com`,
      user_name: `Test User ${i + 1} ${timestamp}`,
      password: 'testpassword123',
      role: i < adminCount ? USER_ROLES.ADMIN : USER_ROLES.EMPLOYEE, // First 10% are admins
    })),

    references: Array.from({ length: count }, (_, i) => {
      const categories = Object.values(REFERENCE_CATEGORIES);
      return {
        name: `Test Reference ${i + 1} ${timestamp}`,
        mobile_no: `9${String(i + 1000000000).slice(0, 9)}`, // Generate valid 10-digit mobile numbers
        category: categories[i % categories.length],
      };
    }),

    customers: Array.from({ length: count }, (_, i) => ({
      name: `Test Customer ${i + 1} ${timestamp}`,
      mobile_no: `8${String(i + 2000000000).slice(0, 9)}`, // Generate unique mobile numbers
      address: `Test Address ${i + 1}, Test City ${timestamp}`,
      gst_number: i % 3 === 0 ? `GST${String(i + 1).padStart(3, '0')}${timestamp.slice(-6)}` : null,
    })),

    products: Array.from({ length: count }, (_, i) => {
      const units = Object.values(PRODUCT_UNITS);
      return {
        name: `Test Product ${i + 1} ${timestamp}`,
        description: `Test description for product ${i + 1} created at ${timestamp}`,
        unit: units[i % units.length],
      };
    }),

    locations: Array.from({ length: count }, (_, i) => ({
      name: `Test Location ${i + 1} ${timestamp}`,
    })),

    quotations: Array.from({ length: count }, (_, i) => ({
      quotation_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
      remarks: `Test quotation ${i + 1} created at ${timestamp}`,
      price_type: i % 2 === 0 ? PRICE_TYPES.INCLUSIVE_TAX : PRICE_TYPES.EXCLUSIVE_TAX,
      // customer_id and created_by will be assigned after creating users and customers
    })),
  };
};

/**
 * Seed test data for all entities (Admin only)
 */
const seedTestData = async (req, res) => {
  const transaction = await User.sequelize.transaction();

  try {
    // Validate and extract count from request body
    const { count } = req.body;

    // Validation
    if (!count || typeof count !== 'number' || !Number.isInteger(count) || count < 1) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Count must be a positive integer',
        error: 'Invalid count parameter. Please provide a positive integer value.',
      });
    }

    if (count > 1000) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Count cannot exceed 1000',
        error: 'Maximum allowed count is 1000 to prevent database overload.',
      });
    }

    console.log(`Starting test data seeding for ${count} records each...`);

    const testData = generateTestData(count);
    const results = {};

    // Create users
    console.log(`Creating ${count} test users...`);
    const createdUsers = await User.bulkCreate(testData.users, {
      transaction,
      returning: true,
      individualHooks: true, // Ensure password hashing hooks run
    });
    results.users = {
      count: createdUsers.length,
      sample: createdUsers.slice(0, 3).map(user => user.toJSON()),
    };

    // Create references
    console.log(`Creating ${count} test references...`);
    const createdReferences = await Reference.bulkCreate(testData.references, {
      transaction,
      returning: true,
    });
    results.references = {
      count: createdReferences.length,
      sample: createdReferences.slice(0, 3),
    };

    // Create customers with some random reference assignments
    console.log(`Creating ${count} test customers...`);
    const customersWithReferences = testData.customers.map((customer, i) => ({
      ...customer,
      // Assign reference to 60% of customers randomly
      reference_id: i % 5 !== 0 ? createdReferences[i % createdReferences.length].id : null,
    }));

    const createdCustomers = await Customer.bulkCreate(customersWithReferences, {
      transaction,
      returning: true,
    });
    results.customers = {
      count: createdCustomers.length,
      sample: createdCustomers.slice(0, 3),
    };

    // Create products
    console.log(`Creating ${count} test products...`);
    const createdProducts = await Product.bulkCreate(testData.products, {
      transaction,
      returning: true,
    });
    results.products = {
      count: createdProducts.length,
      sample: createdProducts.slice(0, 3),
    };

    // Create locations
    console.log(`Creating ${count} test locations...`);
    const createdLocations = await Location.bulkCreate(testData.locations, {
      transaction,
      returning: true,
    });
    results.locations = {
      count: createdLocations.length,
      sample: createdLocations.slice(0, 3),
    };

    // Create quotations with items and images
    console.log(`Creating ${count} test quotations with items...`);

    // Read the maruti letter head image file
    const letterHeadPath = path.join(__dirname, '../assets/maruti_letter_head.jfif');
    const letterHeadBuffer = fs.readFileSync(letterHeadPath);

    const createdQuotations = [];
    let totalItems = 0;

    for (let i = 0; i < count; i++) {
      // Assign customer and creator to quotation
      const quotationData = {
        ...testData.quotations[i],
        customer_id: createdCustomers[i % createdCustomers.length].id,
        created_by: createdUsers[i % createdUsers.length].id,
      };

      // Create quotation
      const quotation = await Quotation.create(quotationData, { transaction });

      // Generate 1-5 items for each quotation
      const itemCount = Math.floor(Math.random() * 5) + 1; // 1 to 5 items
      const quotationItems = [];

      for (let j = 0; j < itemCount; j++) {
        // Upload image to S3 for this item
        const imagePath = await uploadImage(
          letterHeadBuffer,
          'maruti_letter_head.jfif',
          'image/jpeg',
          quotation.id
        );

        // Random product and location
        const product = createdProducts[Math.floor(Math.random() * createdProducts.length)];
        const location =
          Math.random() > 0.3
            ? createdLocations[Math.floor(Math.random() * createdLocations.length)]
            : null; // 70% chance of having location

        const itemData = {
          quotation_id: quotation.id,
          product_id: product.id,
          description: `Test item ${j + 1} for quotation ${i + 1}`,
          rate: parseFloat((Math.random() * 1000 + 50).toFixed(2)), // Random rate between 50-1050
          discount: Math.random() > 0.5 ? parseFloat((Math.random() * 100).toFixed(2)) : null, // 50% chance of discount
          discount_type: Math.random() > 0.5 ? DISCOUNT_TYPES.PERCENTAGE : DISCOUNT_TYPES.PER_PIECE,
          unit: product.unit,
          images: [imagePath],
          location_id: location ? location.id : null,
          quantity: Math.floor(Math.random() * 10) + 1, // 1-10 quantity
        };

        const item = await Item.create(itemData, { transaction });
        quotationItems.push(item);
        totalItems++;
      }

      // Generate PDF for this quotation
      try {
        // Fetch complete quotation data with all associations for PDF generation
        const completeQuotation = await Quotation.findByPk(quotation.id, {
          include: [
            {
              model: Customer,
              as: 'customer',
              include: [
                {
                  model: Reference,
                  as: 'reference',
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
                },
                {
                  model: Location,
                  as: 'location',
                },
              ],
            },
          ],
          transaction,
        });

        console.log(`Generating PDF for quotation ${i + 1}...`);
        const pdfPath = await generateAndUploadQuotationPDF(completeQuotation, quotation.id);

        // Update quotation with PDF path
        await quotation.update({ pdf_path: pdfPath }, { transaction });

        createdQuotations.push({
          ...quotation.toJSON(),
          pdf_path: pdfPath,
          items: quotationItems,
        });
      } catch (pdfError) {
        console.error(`Error generating PDF for quotation ${i + 1}:`, pdfError);
        // Continue without PDF if generation fails
        createdQuotations.push({
          ...quotation.toJSON(),
          items: quotationItems,
        });
      }
    }

    results.quotations = {
      count: createdQuotations.length,
      sample: createdQuotations.slice(0, 3).map(q => ({
        ...q,
        items: q.items.slice(0, 2), // Show only first 2 items in sample
      })),
    };

    results.items = {
      count: totalItems,
      sample: `${totalItems} items created across ${count} quotations`,
    };

    await transaction.commit();

    console.log('Test data seeding completed successfully');

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Test data seeded successfully',
      data: {
        summary: {
          users: results.users.count,
          references: results.references.count,
          customers: results.customers.count,
          products: results.products.count,
          locations: results.locations.count,
          quotations: results.quotations.count,
          items: results.items.count,
          total:
            results.users.count +
            results.references.count +
            results.customers.count +
            results.products.count +
            results.locations.count +
            results.quotations.count +
            results.items.count,
        },
        samples: {
          users: results.users.sample,
          references: results.references.sample,
          customers: results.customers.sample,
          products: results.products.sample,
          locations: results.locations.sample,
          quotations: results.quotations.sample,
          items: results.items.sample,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Seed test data error:', error);

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to seed test data',
      error:
        process.env.NODE_ENV === 'development'
          ? error.message
          : ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
    });
  }
};

/**
 * Clean up test data (Admin only)
 */
const cleanTestData = async (req, res) => {
  const transaction = await User.sequelize.transaction();

  try {
    console.log('Starting test data cleanup...');

    // Get current timestamp pattern to identify test data
    const testDataPattern = '%Test%';
    const Op = require('sequelize').Op;

    // FIRST: Handle quotations and their S3 images
    console.log('Finding test quotations and their images...');

    // Find all test quotations with their items and images
    const testQuotations = await Quotation.findAll({
      where: {
        remarks: { [Op.like]: testDataPattern },
      },
      include: [
        {
          model: Item,
          as: 'items',
          attributes: ['id', 'images'],
        },
      ],
      transaction,
    });

    // Collect all image paths from items and PDF paths from quotations
    const allImagePaths = [];
    const allPdfPaths = [];

    testQuotations.forEach(quotation => {
      // Collect PDF paths
      if (quotation.pdf_path) {
        allPdfPaths.push(quotation.pdf_path);
      }

      // Collect image paths from items
      quotation.items.forEach(item => {
        if (item.images && item.images.length > 0) {
          allImagePaths.push(...item.images);
        }
      });
    });

    // Delete PDFs from S3
    if (allPdfPaths.length > 0) {
      console.log(`Deleting ${allPdfPaths.length} PDFs from S3...`);
      for (const pdfPath of allPdfPaths) {
        try {
          await deleteQuotationPDF(pdfPath);
        } catch (error) {
          console.error(`Error deleting PDF ${pdfPath}:`, error.message);
          // Continue with other deletions even if one fails
        }
      }
    }

    // Delete images from S3
    if (allImagePaths.length > 0) {
      console.log(`Deleting ${allImagePaths.length} images from S3...`);
      await deleteMultipleImages(allImagePaths);
    }

    // Delete items (will cascade delete due to foreign key)
    const deletedItems = await Item.destroy({
      where: {
        quotation_id: {
          [Op.in]: testQuotations.map(q => q.id),
        },
      },
      transaction,
    });

    // Delete quotations
    const deletedQuotations = await Quotation.destroy({
      where: {
        remarks: { [Op.like]: testDataPattern },
      },
      transaction,
    });

    // THEN: Delete other entities in reverse order to respect foreign key constraints
    const deletedCustomers = await Customer.destroy({
      where: {
        name: { [Op.like]: testDataPattern },
      },
      transaction,
    });

    const deletedReferences = await Reference.destroy({
      where: {
        name: { [Op.like]: testDataPattern },
      },
      transaction,
    });

    const deletedProducts = await Product.destroy({
      where: {
        name: { [Op.like]: testDataPattern },
      },
      transaction,
    });

    const deletedLocations = await Location.destroy({
      where: {
        name: { [Op.like]: testDataPattern },
      },
      transaction,
    });

    const deletedUsers = await User.destroy({
      where: {
        email: { [Op.like]: '%@marutitest.com' },
      },
      transaction,
    });

    await transaction.commit();

    console.log('Test data cleanup completed successfully');

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Test data cleaned up successfully',
      data: {
        deleted: {
          users: deletedUsers,
          references: deletedReferences,
          customers: deletedCustomers,
          products: deletedProducts,
          locations: deletedLocations,
          quotations: deletedQuotations,
          items: deletedItems,
          imagesFromS3: allImagePaths.length,
          pdfsFromS3: allPdfPaths.length,
          total:
            deletedUsers +
            deletedReferences +
            deletedCustomers +
            deletedProducts +
            deletedLocations +
            deletedQuotations +
            deletedItems,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Clean test data error:', error);

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to clean test data',
      error:
        process.env.NODE_ENV === 'development'
          ? error.message
          : ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
    });
  }
};

module.exports = {
  seedTestData,
  cleanTestData,
};
