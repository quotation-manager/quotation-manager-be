const express = require('express');
const { login } = require('../controllers/authController');
const { validateBody } = require('../middleware/validation');
const { loginValidator } = require('../validators/authValidators');
const { API_ROUTES } = require('../utils/constants');

const router = express.Router();

// POST /auth/login - Login user
router.post('/login', validateBody(loginValidator), login);

module.exports = router;
