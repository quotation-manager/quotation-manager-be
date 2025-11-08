const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const specs = require('./swagger');

// Import middleware
const errorHandler = require('../middleware/errorHandler');
const notFound = require('../middleware/notFound');

// Import routes
const healthRoutes = require('../routes/health');
const authRoutes = require('../routes/auth');
const userRoutes = require('../routes/users');
const referenceRoutes = require('../routes/references');
const customerRoutes = require('../routes/customers');
const productRoutes = require('../routes/products');
const locationRoutes = require('../routes/locations');
const quotationRoutes = require('../routes/quotations');
const seedRoutes = require('../routes/seed');

const createApp = () => {
  const app = express();

  // Trust proxy for production deployment
  app.set('trust proxy', 1);

  // Security middleware
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:', 'https:'],
          scriptSrc: ["'self'"],
        },
      },
    })
  );

  // CORS configuration
  app.use(cors());

  // Logging middleware
  if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined'));
  }

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // API documentation
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(specs, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Maruti API Documentation',
    })
  );

  // Health check endpoint (before API prefix)
  app.use('/health', healthRoutes);

  // API routes with prefix
  const apiPrefix = process.env.API_PREFIX || '/api/v1';

  // Welcome route
  app.get('/', (req, res) => {
    res.json({
      success: true,
      message: 'Welcome to Maruti Backend API',
      version: '1.0.0',
      documentation: '/api-docs',
      health: '/health',
      api: apiPrefix,
      endpoints: {
        auth: `${apiPrefix}/auth`,
        users: `${apiPrefix}/users`,
        references: `${apiPrefix}/references`,
        customers: `${apiPrefix}/customers`,
        products: `${apiPrefix}/products`,
        locations: `${apiPrefix}/locations`,
        quotations: `${apiPrefix}/quotations`,
        seed: `${apiPrefix}/seed`,
      },
    });
  });

  // API routes
  app.use(`${apiPrefix}/auth`, authRoutes);
  app.use(`${apiPrefix}/users`, userRoutes);
  app.use(`${apiPrefix}/references`, referenceRoutes);
  app.use(`${apiPrefix}/customers`, customerRoutes);
  app.use(`${apiPrefix}/products`, productRoutes);
  app.use(`${apiPrefix}/locations`, locationRoutes);
  app.use(`${apiPrefix}/quotations`, quotationRoutes);
  app.use(`${apiPrefix}/seed`, seedRoutes);

  // Error handling middleware (must be last)
  app.use(notFound);
  app.use(errorHandler);

  return app;
};

module.exports = createApp;
