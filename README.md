# Maruti Backend API

A comprehensive Node.js Express API for shop management, featuring user authentication, customer management, reference tracking, and role-based access control with complete documentation.

## 🚀 Features

- **Express.js Framework** - Fast, minimal web framework
- **PostgreSQL Database** - Reliable relational database with Sequelize ORM
- **Customer Management** - Complete customer lifecycle management
- **Reference Tracking** - Track and manage customer referral sources
- **Product Catalog** - Comprehensive product inventory management
- **User Authentication** - JWT-based authentication system
- **Role-Based Access** - Admin and Employee roles with proper authorization
- **Data Relationships** - Foreign key constraints with referential integrity
- **Input Validation** - Comprehensive request validation using Joi
- **Security First** - Helmet, CORS, and other security middleware
- **API Documentation** - Interactive Swagger/OpenAPI documentation
- **Code Quality** - ESLint and Prettier for consistent code formatting
- **Error Handling** - Centralized error handling middleware
- **Environment Management** - Secure environment variable handling
- **Health Monitoring** - Health check endpoints for system monitoring

## 📁 Project Structure

```
maruti-be/
├── src/
│   ├── config/
│   │   ├── app.js              # Express app configuration
│   │   ├── config.js           # Sequelize database configuration
│   │   ├── database.js         # Database connection setup
│   │   └── swagger.js          # Swagger documentation setup
│   ├── controllers/
│   │   ├── authController.js   # Authentication logic
│   │   ├── healthController.js # Health check handlers
│   │   ├── userController.js   # User management logic
│   │   ├── referenceController.js # Reference management logic
│   │   ├── customerController.js  # Customer management logic
│   │   ├── productController.js   # Product management logic
│   │   └── quotationController.js # Quotation management logic
│   ├── docs/                   # Modular Swagger documentation
│   │   ├── auth.swagger.json   # Authentication endpoints docs
│   │   ├── health.swagger.json # Health endpoints docs
│   │   ├── users.swagger.json  # User management endpoints docs
│   │   ├── references.swagger.json # Reference management endpoints docs
│   │   ├── customers.swagger.json  # Customer management endpoints docs
│   │   ├── products.swagger.json   # Product management endpoints docs
│   │   ├── swagger-config.json # Base Swagger configuration
│   │   └── README.md          # Documentation structure guide
│   ├── middleware/
│   │   ├── auth.js            # Authentication & authorization
│   │   ├── errorHandler.js    # Global error handling
│   │   ├── notFound.js        # 404 error handling
│   │   └── validation.js      # Request validation middleware
│   ├── migrations/            # Database migration files
│   │   └── 20250726114449-create-user.js
│   ├── models/                # Sequelize models
│   │   ├── index.js          # Model loader
│   │   ├── user.js           # User model definition
│   │   ├── reference.js      # Reference model definition
│   │   ├── customer.js       # Customer model definition
│   │   ├── product.js        # Product model definition
│   │   ├── location.js       # Location model definition
│   │   ├── quotation.js      # Quotation model definition
│   │   └── item.js           # Item model definition
│   ├── routes/
│   │   ├── auth.js           # Authentication routes
│   │   ├── health.js         # Health check routes
│   │   ├── users.js          # User management routes
│   │   ├── references.js     # Reference management routes
│   │   ├── customers.js      # Customer management routes
│   │   ├── products.js       # Product management routes
│   │   └── quotations.js     # Quotation management routes
│   ├── seeders/              # Database seeders
│   │   └── 20250726115531-create-admin-user.js
│   ├── services/             # Business logic services
│   │   └── s3Service.js      # AWS S3 image upload service
│   ├── utils/
│   │   ├── constants.js      # Application constants
│   │   └── swaggerMerger.js  # Swagger documentation merger
│   ├── validators/
│   │   ├── authValidators.js # Authentication validation schemas
│   │   ├── userValidators.js # User validation schemas
│   │   ├── referenceValidators.js # Reference validation schemas
│   │   ├── customerValidators.js  # Customer validation schemas
│   │   ├── productValidators.js   # Product validation schemas
│   │   ├── locationValidators.js  # Location validation schemas
│   │   └── quotationValidators.js # Quotation validation schemas
│   └── server.js             # Application entry point
├── .env                      # Environment variables (not in git)
├── .env.example             # Environment variables template
├── .eslintrc.js             # ESLint configuration
├── .gitignore              # Git ignore patterns
├── .prettierrc             # Prettier configuration
├── .prettierignore         # Prettier ignore patterns
├── .sequelizerc            # Sequelize CLI configuration
├── eslint.config.js        # Modern ESLint configuration
├── package.json            # Project dependencies and scripts
└── README.md              # Project documentation
```

## 🛠️ Prerequisites

- **Node.js** (v16.18.0 or higher)
- **npm** (v8.19.2 or higher)
- **PostgreSQL** (v12 or higher)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/maruti-company/maruti-be.git
cd maruti-be
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
```

Update the `.env` file with your database credentials:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=maruti_db
DB_USER=maruti_user
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=24h

# Server Configuration
PORT=3000
NODE_ENV=development
```

### 3. Database Setup

```bash
# Create database and user in PostgreSQL
createdb maruti_db
psql -c "CREATE USER maruti_user WITH PASSWORD 'your_password';"
psql -c "GRANT ALL PRIVILEGES ON DATABASE maruti_db TO maruti_user;"

# Run migrations to create tables
npm run db:migrate

# Seed initial admin user
npm run db:seed
```

### 4. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3000`

## 📜 Available Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start development server with auto-reload |
| `npm run lint` | Run ESLint to check code quality |
| `npm run lint:check` | Check for linting issues without fixing |
| `npm run format` | Format code using Prettier |
| `npm run format:check` | Check code formatting without fixing |
| `npm run format:all` | Format all supported files |
| `npm run pre-commit` | Run linting and formatting (for git hooks) |
| `npm run db:migrate` | Run database migrations |
| `npm run db:seed` | Run database seeders |

## 🔗 API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login

### User Management (Admin Only)
- `GET /api/v1/users` - Get all users (with pagination & name filtering)
- `POST /api/v1/users` - Create new user
- `GET /api/v1/users/:id` - Get user by ID
- `PUT /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user

### Reference Management (Admin & Employee)
- `GET /api/v1/references` - Get all references (with pagination, category & search filtering)
- `GET /api/v1/references/categories` - Get all available reference categories
- `POST /api/v1/references` - Create new reference
- `GET /api/v1/references/:id` - Get reference by ID with customers
- `PUT /api/v1/references/:id` - Update reference
- `DELETE /api/v1/references/:id` - Delete reference (Admin only)

### Customer Management (Admin & Employee)
- `GET /api/v1/customers` - Get all customers (with pagination, reference & search filtering)
- `POST /api/v1/customers` - Create new customer
- `GET /api/v1/customers/:id` - Get customer by ID with reference
- `PUT /api/v1/customers/:id` - Update customer
- `DELETE /api/v1/customers/:id` - Delete customer (Admin only)

### Product Management (Admin & Employee)
- `GET /api/v1/products` - Get all products (with pagination, unit & name filtering)
- `GET /api/v1/products/units` - Get all available product units
- `POST /api/v1/products` - Create new product
- `GET /api/v1/products/:id` - Get product by ID
- `PUT /api/v1/products/:id` - Update product
- `DELETE /api/v1/products/:id` - Delete product (Admin only)

### Location Management (Admin & Employee)
- `GET /api/v1/locations` - Get all locations (with pagination & name filtering)
- `POST /api/v1/locations` - Create new location
- `GET /api/v1/locations/:id` - Get location by ID
- `PUT /api/v1/locations/:id` - Update location
- `DELETE /api/v1/locations/:id` - Delete location (Admin only)

### Quotation Management (Admin & Employee)
- `GET /api/v1/quotations` - Get all quotations (with pagination, customer & date filtering)
- `POST /api/v1/quotations` - Create new quotation with items and images
- `GET /api/v1/quotations/:id` - Get quotation by ID with items and associations
- `PUT /api/v1/quotations/:id` - Update quotation with items and images
- `PATCH /api/v1/quotations/:id/shared-date` - Update last shared date to current datetime
- `POST /api/v1/quotations/:id/regenerate-pdf` - Regenerate PDF for quotation
- `DELETE /api/v1/quotations/:id` - Delete quotation (Admin only)

### Public Quotation Access (No Authentication Required)
- `GET /api/v1/quotations/public/:id` - Get public quotation details (valid for 3 months after sharing)

### Test Data Seeding (Admin Only)
- `POST /api/v1/seed` - Seed specified number of test records for users, references, customers, products, locations, quotations, and items (requires count in request body)
- `DELETE /api/v1/seed` - Clean up all test data (removes all test records, S3 images, and PDFs)

### Health Monitoring
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed system health

## 👥 User System

### Default Admin Account
After running the seeder, you can login with:
- **Email**: `admin@maruti.com`
- **Password**: `admin123`

⚠️ **Important**: Change this password immediately in production!

### User Roles
- **Admin (1)**: Can create, read, update, delete users and other admins
- **Employee (2)**: Standard user role (can only login and access authorized endpoints)

### Authentication Flow
1. User logs in with email/password via `POST /api/v1/auth/login`
2. Server validates credentials and returns JWT token
3. Client includes token in Authorization header: `Bearer <token>`
4. Server validates token on protected routes
5. Admin-only routes check user role for authorization

## 🏪 Business Modules

### Reference Management
Manage people who refer customers to your shop:
- **Categories**: Carpenter, Interior Designer, Dealer, Builder, Direct/Walking, Staff, Relation, Other
- **Fields**: Name (required), Mobile Number (optional), Category (required)
- **Features**: Pagination, category filtering, search filtering (name & mobile), customer association tracking
- **Business Logic**: Cannot delete references with associated customers

### Customer Management
Core customer data management:
- **Fields**: Name (required), Mobile Number (required), Address (optional), Reference (optional)
- **Features**: Pagination, reference filtering, search filtering (name & mobile), reference relationship tracking
- **Validation**: Mobile number format validation, reference existence verification

### Data Relationships
- **One-to-Many**: Reference → Customers
- **Foreign Key**: Customer.reference_id → Reference.id
- **Constraints**: RESTRICT on delete (protects data integrity), CASCADE on update

### Product Catalog
Manage your shop's product inventory:
- **Fields**: Name (required), Description (optional), Unit (required)
- **Units**: BOX, CU.FEET, CDM, DOZEN, KGS, METER, PCS, R.FEET, SET, SQ.MT, SQ.FT, SQ.FT (Inches)
- **Features**: Pagination, unit filtering, name filtering, comprehensive validation
- **Validation**: Name length (2-200 chars), description length (max 1000 chars), unit validation

### Location Management
Manage locations where products are used:
- **Fields**: Name (required)
- **Features**: Pagination, name filtering, unique name constraint
- **Validation**: Name length (2-100 chars), unique name validation
- **Business Logic**: Employees cannot delete locations, only admins can

### Quotation Management
Manage customer quotations with items and images:
- **Fields**: Quotation Date (required), Customer ID (required), Last Shared Date (optional), Remarks (optional, max 1000 chars), Price Type (Inclusive Tax/Exclusive Tax, default: Inclusive Tax), PDF Path (auto-generated), Created By (auto-filled from logged-in user)
- **Items**: Product ID (required), Description (optional), Rate (required), Discount (optional), Unit (auto-filled from product), Images (optional, max 1 per item), Location ID (optional), Quantity (positive integer, default: 1)
- **Features**: Pagination, customer filtering, date range filtering, image upload to S3 with **automatic compression** (create) and **smart re-compression avoidance** (edit), automatic unit assignment, **PDF generation and storage**, **public access links**
- **Validation**: Rate/discount as positive decimals, max 1 image per item (5MB each), proper foreign key relationships, quantity as positive integer
- **Business Logic**: Deleting quotation deletes all items and PDF, employees cannot delete quotations, automatic S3 cleanup, user tracking (created_by field automatically set to logged-in user on create/update, becomes null if user is deleted)
- **Public Access**: Shareable links valid for 3 months after sharing, no authentication required
- **Image Storage**: AWS S3 integration with organized folder structure (`quotations/{quotation_id}/items/`), path storage in database, **automatic image compression** for optimized storage and bandwidth
- **PDF Generation**: Automatic PDF generation using jsPDF, professional layout with Maruti Laminates branding, S3 storage in `quotations/{quotation_id}/` folder

### Image Compression
Automatic image compression for optimized storage and bandwidth:
- **Compression Settings**: Configurable quality (75% default), preserves original dimensions, JPEG output format
- **Quality-Only Compression**: Reduces file size (KB) without changing image dimensions (pixels)
- **Smart Compression**: Only compresses images larger than 100KB, preserves original if compression fails
- **Compression Detection**: Images are marked with "_compressed" suffix to avoid re-compression in edit operations
- **Edit Optimization**: Edit quotation API automatically detects already compressed images and skips re-compression
- **Supported Formats**: JPEG, PNG, WebP input formats, always outputs JPEG for consistency
- **Storage Optimization**: Reduces file sizes by 20-80% while maintaining original image dimensions
- **Configuration**: Adjustable via `IMAGE_CONFIG.COMPRESSION` constants in `src/utils/constants.js`

### Test Data Seeding
For testing and development purposes, seed large datasets:
- **Dynamic Data Volume**: Create any number of records (1-1000) for users, references, customers, products, locations, quotations, and items
- **Request Body**: Requires `{ "count": number }` in POST request body (e.g., `{ "count": 250 }` creates comprehensive test data)
- **Validation**: Count must be between 1 and 1000 to prevent database overload
- **Quotations & Items**: Each quotation contains 1-5 random items with realistic data (rates, discounts, quantities)
- **S3 Image Integration**: Every item gets the maruti_letter_head.jfif uploaded to S3 with automatic compression
- **PDF Generation**: Professional PDFs generated for each quotation and uploaded to S3
- **Timestamp Differentiation**: All test data includes timestamps in names/emails to differentiate from real data
- **Admin Access Only**: Seeding endpoints are restricted to admin users only
- **Smart Relationships**: Test customers are randomly assigned to test references (60% assignment rate)
- **User Mix**: Test users include both admin (first 10%) and employee roles with minimum 1 admin
- **Cleanup Support**: Complete cleanup of all test data, S3 images, and PDFs with a single DELETE request
- **Transaction Safety**: All operations are wrapped in database transactions for data integrity
- **Production Safe**: Test data is clearly marked and identifiable for safe cleanup

## 📚 API Documentation

Interactive API documentation is available at:
- **Development**: `http://localhost:3000/api-docs`
- **Production**: `https://api.maruti.com/api-docs`

The documentation is built using modular JSON files for better maintainability.

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT`