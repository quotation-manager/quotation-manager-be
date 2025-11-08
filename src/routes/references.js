const express = require('express');
const {
  createReference,
  getReferences,
  getReferenceById,
  updateReference,
  deleteReference,
  getReferenceCategories,
} = require('../controllers/referenceController');

const { validateBody, validateParams, validateQuery } = require('../middleware/validation');
const { authenticate, requireAdmin } = require('../middleware/auth');
const {
  createReferenceValidator,
  updateReferenceValidator,
  getReferencesValidator,
  referenceIdValidator,
} = require('../validators/referenceValidators');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// GET /api/v1/references - Get all references (Both Admin and Employee)
router.get('/', validateQuery(getReferencesValidator), getReferences);

// GET /api/v1/references/categories - Get reference categories (Both Admin and Employee)
router.get('/categories', getReferenceCategories);

// POST /api/v1/references - Create reference (Both Admin and Employee)
router.post('/', validateBody(createReferenceValidator), createReference);

// GET /api/v1/references/:id - Get reference by ID (Both Admin and Employee)
router.get('/:id', validateParams(referenceIdValidator), getReferenceById);

// PUT /api/v1/references/:id - Update reference (Both Admin and Employee)
router.put(
  '/:id',
  validateParams(referenceIdValidator),
  validateBody(updateReferenceValidator),
  updateReference
);

// DELETE /api/v1/references/:id - Delete reference (Admin only)
router.delete('/:id', requireAdmin, validateParams(referenceIdValidator), deleteReference);

module.exports = router;
