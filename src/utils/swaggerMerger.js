const fs = require('fs');
const path = require('path');

/**
 * Merge multiple Swagger JSON files into a single specification
 * @param {string} docsPath - Path to the docs directory
 * @param {object} baseConfig - Base Swagger configuration
 * @returns {object} Merged Swagger specification
 */
const mergeSwaggerFiles = (docsPath, baseConfig) => {
  const mergedSpec = { ...baseConfig };

  // Initialize paths and components if they don't exist
  if (!mergedSpec.paths) {
    mergedSpec.paths = {};
  }
  if (!mergedSpec.components) {
    mergedSpec.components = {};
  }
  if (!mergedSpec.components.schemas) {
    mergedSpec.components.schemas = {};
  }

  try {
    // Get all .swagger.json files from the docs directory
    const files = fs
      .readdirSync(docsPath)
      .filter(file => file.endsWith('.swagger.json'))
      .map(file => path.join(docsPath, file));

    files.forEach(filePath => {
      try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const swaggerModule = JSON.parse(fileContent);

        // Merge paths
        if (swaggerModule.paths) {
          Object.assign(mergedSpec.paths, swaggerModule.paths);
        }

        // Merge components/schemas
        if (swaggerModule.components && swaggerModule.components.schemas) {
          Object.assign(mergedSpec.components.schemas, swaggerModule.components.schemas);
        }

        // Merge other components if needed
        if (swaggerModule.components) {
          Object.keys(swaggerModule.components).forEach(key => {
            if (key !== 'schemas') {
              if (!mergedSpec.components[key]) {
                mergedSpec.components[key] = {};
              }
              Object.assign(mergedSpec.components[key], swaggerModule.components[key]);
            }
          });
        }

        console.log(`✅ Merged Swagger file: ${path.basename(filePath)}`);
      } catch (error) {
        console.error(`❌ Error reading Swagger file ${filePath}:`, error.message);
      }
    });

    console.log(`🎯 Successfully merged ${files.length} Swagger files`);
  } catch (error) {
    console.error('❌ Error reading docs directory:', error.message);
  }

  return mergedSpec;
};

/**
 * Load base configuration from JSON file
 * @param {string} configPath - Path to the base config file
 * @returns {object} Base configuration object
 */
const loadBaseConfig = configPath => {
  try {
    const configContent = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(configContent);
  } catch (error) {
    console.error('❌ Error loading base config:', error.message);
    return {};
  }
};

module.exports = {
  mergeSwaggerFiles,
  loadBaseConfig,
};
