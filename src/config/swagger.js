const path = require('path');
const { mergeSwaggerFiles, loadBaseConfig } = require('../utils/swaggerMerger');

// Paths
const docsPath = path.join(__dirname, '../docs');
const baseConfigPath = path.join(docsPath, 'swagger-config.json');

// Load base configuration
const baseConfig = loadBaseConfig(baseConfigPath);

// Merge all Swagger modules
const mergedSpec = mergeSwaggerFiles(docsPath, baseConfig);

// Update server URLs with environment variables
if (mergedSpec.servers) {
  mergedSpec.servers = mergedSpec.servers.map(server => {
    if (server.url.includes('localhost')) {
      return {
        ...server,
        url: server.url.replace('3000', process.env.PORT || '3000'),
      };
    }
    return server;
  });
}

module.exports = mergedSpec;
