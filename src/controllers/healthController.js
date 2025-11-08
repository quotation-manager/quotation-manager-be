const packageJson = require('../../package.json');

const healthCheck = async (req, res) => {
  try {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: packageJson.version,
      memory: {
        used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
        total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100,
        external: Math.round((process.memoryUsage().external / 1024 / 1024) * 100) / 100,
      },
      cpu: {
        user: process.cpuUsage().user,
        system: process.cpuUsage().system,
      },
    };

    // Additional health checks can be added here
    // For example: database connectivity, external service status, etc.

    res.status(200).json({
      success: true,
      message: 'Server is healthy',
      data: healthData,
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Server health check failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

const detailedHealthCheck = async (req, res) => {
  try {
    const healthData = {
      server: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: packageJson.version,
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        memory: {
          used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
          total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100,
          external: Math.round((process.memoryUsage().external / 1024 / 1024) * 100) / 100,
          rss: Math.round((process.memoryUsage().rss / 1024 / 1024) * 100) / 100,
        },
        cpu: process.cpuUsage(),
      },
      database: {
        status: 'not_connected', // Will be updated when database is configured
        latency: null,
      },
      services: {
        // Add external service health checks here
      },
    };

    res.status(200).json({
      success: true,
      message: 'Detailed server health information',
      data: healthData,
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Detailed health check failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

module.exports = {
  healthCheck,
  detailedHealthCheck,
};
