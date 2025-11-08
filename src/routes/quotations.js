const express = require('express');
const multer = require('multer');
const {
  createQuotation,
  getQuotations,
  getQuotationById,
  updateQuotation,
  deleteQuotation,
  updateLastSharedDate,
  regeneratePDF,
  getPublicQuotation,
} = require('../controllers/quotationController');
const { validateBody, validateParams, validateQuery } = require('../middleware/validation');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { checkEditQuotationAccess } = require('../middleware/timeAccessControl');
const {
  createQuotationValidator,
  updateQuotationValidator,
  getQuotationsValidator,
  quotationIdValidator,
  updateLastSharedDateValidator,
} = require('../validators/quotationValidators');
const { IMAGE_CONFIG } = require('../utils/constants');

const router = express.Router();

// Public route - no authentication required
router.get('/public/:id', validateParams(quotationIdValidator), getPublicQuotation);

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: IMAGE_CONFIG.MAX_FILE_SIZE_BYTES,
    files: IMAGE_CONFIG.MAX_FILES_PER_QUOTATION, // Allow up to 20 items with multiple images each (5 * 20 = 100 files max)
  },
  fileFilter: (req, file, cb) => {
    if (IMAGE_CONFIG.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Invalid file type. Only ${IMAGE_CONFIG.ALLOWED_MIME_TYPES.join(', ')} are allowed`
        ),
        false
      );
    }
  },
});

// Apply authentication to all routes
router.use(authenticate);

// Get all quotations with pagination and filtering
router.get('/', validateQuery(getQuotationsValidator), getQuotations);

// Create new quotation with items and images
router.post('/', upload.any(), validateBody(createQuotationValidator), createQuotation);

// Get quotation by ID
router.get('/:id', validateParams(quotationIdValidator), getQuotationById);

// Update quotation with items and images
router.put(
  '/:id',
  upload.any(),
  validateParams(quotationIdValidator),
  validateBody(updateQuotationValidator),
  checkEditQuotationAccess,
  updateQuotation
);

// Update last shared date
router.patch(
  '/:id/shared-date',
  validateParams(quotationIdValidator),
  validateBody(updateLastSharedDateValidator),
  updateLastSharedDate
);

// Regenerate PDF for quotation
router.post('/:id/regenerate-pdf', validateParams(quotationIdValidator), regeneratePDF);

// Delete quotation (Admin only)
router.delete('/:id', requireAdmin, validateParams(quotationIdValidator), deleteQuotation);

module.exports = router;
