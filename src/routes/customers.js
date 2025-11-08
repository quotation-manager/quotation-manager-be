const express = require('express');
const {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} = require('../controllers/customerController');

const { validateBody, validateParams, validateQuery } = require('../middleware/validation');
const { authenticate, requireAdmin } = require('../middleware/auth');
const {
  createCustomerValidator,
  updateCustomerValidator,
  getCustomersValidator,
  customerIdValidator,
} = require('../validators/customerValidators');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// GET /api/v1/customers - Get all customers (Both Admin and Employee)
router.get('/', validateQuery(getCustomersValidator), getCustomers);

// POST /api/v1/customers - Create customer (Both Admin and Employee)
router.post('/', validateBody(createCustomerValidator), createCustomer);

// GET /api/v1/customers/:id - Get customer by ID (Both Admin and Employee)
router.get('/:id', validateParams(customerIdValidator), getCustomerById);

// PUT /api/v1/customers/:id - Update customer (Both Admin and Employee)
router.put(
  '/:id',
  validateParams(customerIdValidator),
  validateBody(updateCustomerValidator),
  updateCustomer
);

// DELETE /api/v1/customers/:id - Delete customer (Admin only)
router.delete('/:id', requireAdmin, validateParams(customerIdValidator), deleteCustomer);

module.exports = router;
