# Swagger Documentation Structure

This project uses a modular approach to Swagger/OpenAPI documentation using separate JSON files for each module/feature. This provides better organization, maintainability, and easier collaboration.

## 📁 Current File Structure

```
src/docs/
├── README.md                 # This documentation file
├── swagger-config.json       # Base Swagger configuration
└── health.swagger.json       # Health check endpoints
```

## 🔧 How It Works

1. **Base Configuration**: `swagger-config.json` contains the main OpenAPI specification including:
   - API information (title, version, description)
   - Server configurations
   - Global security schemes
   - Common schemas (Error, SuccessResponse)
   - Tags definitions

2. **Module Files**: Each `[module].swagger.json` file contains:
   - Paths specific to that module
   - Schemas specific to that module
   - Component definitions for that module

3. **Auto-Merging**: The `swaggerMerger` utility automatically combines all `.swagger.json` files into a single specification that's served by Swagger UI.

## 📊 Currently Implemented

### Health Module (`health.swagger.json`)
- **GET /health** - Basic health check with server status
- **GET /health/detailed** - Detailed system information including memory, CPU, and environment data

## 📝 Adding New Module Documentation

When you're ready to add a new API module, follow these steps:

### 1. Create Module Swagger File

Create a new file: `src/docs/[module-name].swagger.json`

**Example for a new "products" module:**

```json
{
  "paths": {
    "/products": {
      "get": {
        "summary": "Get all products",
        "description": "Retrieve a list of all products",
        "tags": ["Products"],
        "servers": [
          {
            "url": "http://localhost:3000/api/v1",
            "description": "Development server (API endpoints)"
          },
          {
            "url": "https://api.maruti.com/api/v1",
            "description": "Production server (API endpoints)"
          }
        ],
        "responses": {
          "200": {
            "description": "Products retrieved successfully",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ProductsResponse"
                }
              }
            }
          }
        }
      }
    }
  },
  "components": {
    "schemas": {
      "Product": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "example": "prod123"
          },
          "name": {
            "type": "string",
            "example": "Sample Product"
          },
          "price": {
            "type": "number",
            "example": 99.99
          }
        }
      },
      "ProductsResponse": {
        "type": "object",
        "properties": {
          "success": {
            "type": "boolean",
            "example": true
          },
          "message": {
            "type": "string",
            "example": "Products retrieved successfully"
          },
          "data": {
            "type": "object",
            "properties": {
              "products": {
                "type": "array",
                "items": {
                  "$ref": "#/components/schemas/Product"
                }
              }
            }
          }
        }
      }
    }
  }
}
```

### 2. Add Tag to Base Configuration

Add your module tag to `swagger-config.json`:

```json
{
  "tags": [
    {
      "name": "Health",
      "description": "Health check endpoints for monitoring server status"
    },
    {
      "name": "Products",
      "description": "Product management operations"
    }
  ]
}
```

### 3. Server Auto-Detection

The system will automatically detect and merge your new file when the server restarts.

## 🎯 Best Practices

### Server URLs
- **Health endpoints**: Use base server URLs (no `/api/v1` prefix)
  ```json
  "servers": [
    {
      "url": "http://localhost:3000",
      "description": "Development server (Base URLs for health endpoints)"
    }
  ]
  ```

- **API endpoints**: Use API server URLs (with `/api/v1` prefix)
  ```json
  "servers": [
    {
      "url": "http://localhost:3000/api/v1",
      "description": "Development server (API endpoints)"
    }
  ]
  ```

### Schema References
- Use `$ref` to reference common schemas from the base configuration (Error, SuccessResponse)
- Define module-specific schemas in the module file
- Use consistent naming conventions

### Response Structure
Follow the standard response format:
```json
{
  "success": true/false,
  "message": "Description",
  "data": { /* actual data */ }
}
```

### Security
For protected endpoints, add security requirements:
```json
{
  "security": [
    {
      "bearerAuth": []
    }
  ]
}
```

## 🔄 Development Workflow

1. **Create/Update** your module's `.swagger.json` file
2. **Restart** the development server (`npm run dev`)
3. **View** the updated documentation at `http://localhost:3000/api-docs`
4. **Test** endpoints directly from the Swagger UI

## 📊 Current System Status

The server logs show which files are being merged:
```
✅ Merged Swagger file: health.swagger.json
🎯 Successfully merged 1 Swagger files
```

## 🛠 Troubleshooting

### Common Issues

1. **Module not appearing**: Check that the file ends with `.swagger.json`
2. **Schema references not working**: Ensure schemas are defined in either the base config or the module file
3. **Server URLs incorrect**: Verify you're using the correct server configuration for your endpoint type

### Debug Information

The server startup logs show which Swagger files are being processed and any errors during merging.

## 🚀 Next Steps

When you're ready to add new API modules:

1. **Authentication**: Create `auth.swagger.json` for login/register endpoints
2. **Users**: Create `users.swagger.json` for user management
3. **Products**: Create `products.swagger.json` for product operations
4. **Orders**: Create `orders.swagger.json` for order management

Each new module will be automatically detected and merged into the documentation.

## 📚 Current Example

The `health.swagger.json` file demonstrates:
- Different server configurations for health vs API endpoints
- Comprehensive response schemas with examples
- Proper error handling documentation
- Multiple endpoint variations (basic and detailed)

---

This modular approach ensures your API documentation grows cleanly alongside your actual implementation, without creating documentation for features that don't exist yet. 