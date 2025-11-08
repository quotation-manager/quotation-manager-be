// User Roles
const USER_ROLES = {
  ADMIN: 1,
  EMPLOYEE: 2,
};

// API Routes
const API_ROUTES = {
  AUTH: {
    LOGIN: '/auth/login',
  },
  USERS: {
    BASE: '/users',
    GET_ALL: '/users',
    GET_BY_ID: '/users/:id',
    CREATE: '/users',
    UPDATE: '/users/:id',
    DELETE: '/users/:id',
    CHANGE_PASSWORD: '/users/change-password',
  },
  HEALTH: {
    BASE: '/health',
    DETAILED: '/health/detailed',
  },
};

// HTTP Status Codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

// Error Messages
const ERROR_MESSAGES = {
  // Authentication
  INVALID_CREDENTIALS: 'Invalid email or password',
  UNAUTHORIZED_ACCESS: 'Unauthorized access',
  ADMIN_ACCESS_REQUIRED: 'Admin access required',
  TOKEN_REQUIRED: 'Access token is required',
  INVALID_TOKEN: 'Invalid or expired token',
  INCORRECT_CURRENT_PASSWORD: 'Current password is incorrect',

  // User Management
  USER_NOT_FOUND: 'User not found',
  USER_ALREADY_EXISTS: 'User with this email already exists',
  INVALID_USER_ID: 'Invalid user ID format',
  CANNOT_DELETE_SELF: 'You cannot delete your own account',

  // Validation
  VALIDATION_ERROR: 'Validation error',
  INVALID_EMAIL_FORMAT: 'Invalid email format',
  PASSWORD_TOO_SHORT: 'Password must be at least 6 characters long',
  INVALID_ROLE: 'Invalid user role',
  REQUIRED_FIELD_MISSING: 'Required field is missing',

  // General
  INTERNAL_SERVER_ERROR: 'Internal server error',
  RESOURCE_NOT_FOUND: 'Resource not found',
  BAD_REQUEST: 'Bad request',
};

// Success Messages
const SUCCESS_MESSAGES = {
  // Authentication
  LOGIN_SUCCESSFUL: 'Login successful',
  PASSWORD_CHANGED: 'Password changed successfully',

  // User Management
  USER_CREATED: 'User created successfully',
  USER_UPDATED: 'User updated successfully',
  USER_DELETED: 'User deleted successfully',
  USER_RETRIEVED: 'User retrieved successfully',
  USERS_RETRIEVED: 'Users retrieved successfully',

  // General
  OPERATION_SUCCESSFUL: 'Operation completed successfully',
};

// JWT Configuration
const JWT_CONFIG = {
  EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  SECRET: process.env.JWT_SECRET || 'maruti_super_secret_jwt_key_development_only',
};

// Pagination Defaults
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 1000,
};

// Password Configuration
const PASSWORD_CONFIG = {
  MIN_LENGTH: 6,
  SALT_ROUNDS: 12,
};

// Database Table Names
// Reference Categories
const REFERENCE_CATEGORIES = {
  CARPENTER: 'Carpenter',
  INTERIOR_DESIGNER: 'Interior Designer',
  DEALER: 'Dealer',
  BUILDER: 'Builder',
  DIRECT_WALKING: 'Direct/Walking',
  STAFF: 'Staff',
  RELATION: 'Relation',
  OTHER: 'Other',
};

// Product Units
const PRODUCT_UNITS = {
  BOX: 'BOX',
  CU_FEET: 'CU.FEET',
  CDM: 'CDM',
  DOZEN: 'DOZEN',
  KGS: 'KGS',
  METER: 'METER',
  PCS: 'PCS',
  R_FEET: 'R.FEET',
  SET: 'SET',
  SQ_MT: 'SQ.MT',
  SQ_FT: 'SQ.FT',
  SQ_FT_INCHES: 'SQ.FT (Inches)',
};

const DISCOUNT_TYPES = {
  PERCENTAGE: 'PERCENTAGE',
  PER_PIECE: 'PER_PIECE',
};

// Price Types for Quotations
const PRICE_TYPES = {
  INCLUSIVE_TAX: 'Inclusive Tax',
  EXCLUSIVE_TAX: 'Exclusive Tax',
};

const IMAGE_CONFIG = {
  MAX_IMAGES_PER_ITEM: 1,
  MAX_FILE_SIZE_MB: 5,
  MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024, // 5MB in bytes
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  MAX_FILES_PER_QUOTATION: 50,
  // Image compression settings
  COMPRESSION: {
    ENABLED: true,
    QUALITY: 30, // JPEG quality (1-100) - only affects file size, not dimensions
    PRESERVE_DIMENSIONS: true, // Keep original width and height
    OUTPUT_FORMAT: 'jpeg', // Output format after compression
    MIN_SIZE_TO_COMPRESS: 100 * 1024, // Only compress images larger than 100KB
  },
};

const FILE_CONFIG = {
  MAX_FILE_SIZE_MB: 75,
  MAX_FILE_SIZE_BYTES: 75 * 1024 * 1024, // 10MB in bytes
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'],
};

// Quotation Configuration
const QUOTATION_CONFIG = {
  PUBLIC_ACCESS_EXPIRY_MONTHS: 3, // Public quotation links expire after 3 months
  // Edit access time restrictions for employees (Indian timezone)
  EDIT_ACCESS: {
    START_HOUR: 9, // 9:00 AM
    END_HOUR: 18, // 6:00 PM (18:00)
    TIMEZONE: 'Asia/Kolkata', // Indian Standard Time
    TIME_MESSAGE:
      'Edit quotation is only accessible between 9:00 AM to 6:00 PM IST for employees. Admins can access anytime.',
    DATE_MESSAGE:
      'Employees can only edit quotations created on the current date (IST). Admins can edit any quotation.',
  },
};

const TABLE_NAMES = {
  USERS: 'users',
  REFERENCES: 'references',
  CUSTOMERS: 'customers',
  PRODUCTS: 'products',
  LOCATIONS: 'locations',
  QUOTATIONS: 'quotations',
  ITEMS: 'items',
};

// Company Information
const COMPANY_INFO = {
  GST_NUMBER: '24AAFCM3792F1ZG', // Maruti Laminates GST number
};

module.exports = {
  USER_ROLES,
  API_ROUTES,
  HTTP_STATUS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  JWT_CONFIG,
  PAGINATION,
  PASSWORD_CONFIG,
  REFERENCE_CATEGORIES,
  PRODUCT_UNITS,
  DISCOUNT_TYPES,
  PRICE_TYPES,
  IMAGE_CONFIG,
  FILE_CONFIG,
  QUOTATION_CONFIG,
  TABLE_NAMES,
  COMPANY_INFO,
};
