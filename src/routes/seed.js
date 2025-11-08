const express = require('express');
const { seedTestData, cleanTestData } = require('../controllers/seedController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { validateBody } = require('../middleware/validation');
const { seedDataValidator } = require('../validators/seedValidators');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Apply admin authorization to all routes (only admins can access seed endpoints)
router.use(requireAdmin);

// POST /seed - Seed test data
router.post('/', validateBody(seedDataValidator), seedTestData);

// DELETE /seed - Clean test data
router.delete('/', cleanTestData);

module.exports = router;
