require('dotenv').config();
const createApp = require('./config/app');
const { sequelize } = require('./config/database');

// Handle uncaught exceptions
process.on('uncaughtException', err => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

// Database connection verification
const connectDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully!');
    console.log(
      `📊 Connected to: ${process.env.DB_NAME || 'maruti_db'} on ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}`
    );
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error(`🔴 Error: ${error.message}`);
    console.error('💡 Please check your database configuration in .env file');
    return false;
  }
};

const startServer = async () => {
  // Verify database connection first
  const dbConnected = await connectDatabase();

  if (!dbConnected) {
    console.log('🚫 Server startup cancelled due to database connection failure');
    process.exit(1);
  }

  const app = createApp();
  const PORT = process.env.PORT || 3000;

  const server = app.listen(PORT, () => {
    console.log(`
🚀 Server is running!
📋 Environment: ${process.env.NODE_ENV || 'development'}
🌐 Port: ${PORT}
📖 API Documentation: http://localhost:${PORT}/api-docs
❤️  Health Check: http://localhost:${PORT}/health
🎯 API Base URL: http://localhost:${PORT}${process.env.API_PREFIX || '/api/v1'}
    `);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', err => {
    console.log('UNHANDLED REJECTION! 💥 Shutting down...');
    console.log(err.name, err.message);
    server.close(() => {
      process.exit(1);
    });
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
    sequelize.close();
    server.close(() => {
      console.log('💥 Process terminated!');
    });
  });

  return server;
};

// Start the server
startServer().catch(error => {
  console.error('🔥 Failed to start server:', error);
  process.exit(1);
});

module.exports = { startServer };
