const express = require('express');
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductUnits,
} = require('../controllers/productController');

const { validateBody, validateParams, validateQuery } = require('../middleware/validation');
const { authenticate, requireAdmin } = require('../middleware/auth');
const {
  createProductValidator,
  updateProductValidator,
  getProductsValidator,
  productIdValidator,
} = require('../validators/productValidators');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// GET /api/v1/products - Get all products (Both Admin and Employee)
router.get('/', validateQuery(getProductsValidator), getProducts);

// GET /api/v1/products/units - Get product units (Both Admin and Employee)
router.get('/units', getProductUnits);

// POST /api/v1/products - Create product (Both Admin and Employee)
router.post('/', validateBody(createProductValidator), createProduct);

// GET /api/v1/products/:id - Get product by ID (Both Admin and Employee)
router.get('/:id', validateParams(productIdValidator), getProductById);

// PUT /api/v1/products/:id - Update product (Both Admin and Employee)
router.put(
  '/:id',
  validateParams(productIdValidator),
  validateBody(updateProductValidator),
  updateProduct
);

// DELETE /api/v1/products/:id - Delete product (Admin only)
router.delete('/:id', requireAdmin, validateParams(productIdValidator), deleteProduct);

module.exports = router;
