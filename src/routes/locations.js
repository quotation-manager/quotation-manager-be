const express = require('express');
const {
  createLocation,
  getLocations,
  getLocationById,
  updateLocation,
  deleteLocation,
} = require('../controllers/locationController');

const { validateBody, validateParams, validateQuery } = require('../middleware/validation');
const { authenticate, requireAdmin } = require('../middleware/auth');
const {
  createLocationValidator,
  updateLocationValidator,
  getLocationsValidator,
  locationIdValidator,
} = require('../validators/locationValidators');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// GET /api/v1/locations - Get all locations (Both Admin and Employee)
router.get('/', validateQuery(getLocationsValidator), getLocations);

// POST /api/v1/locations - Create location (Both Admin and Employee)
router.post('/', validateBody(createLocationValidator), createLocation);

// GET /api/v1/locations/:id - Get location by ID (Both Admin and Employee)
router.get('/:id', validateParams(locationIdValidator), getLocationById);

// PUT /api/v1/locations/:id - Update location (Both Admin and Employee)
router.put(
  '/:id',
  validateParams(locationIdValidator),
  validateBody(updateLocationValidator),
  updateLocation
);

// DELETE /api/v1/locations/:id - Delete location (Admin only)
router.delete('/:id', requireAdmin, validateParams(locationIdValidator), deleteLocation);

module.exports = router;
