# E-commerce Application Guide
# Building with Node.js Modular System and Fastify

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
   - [Prerequisites](#prerequisites)
   - [Project Setup](#project-setup)
   - [Framework Configuration](#framework-configuration)
3. [Module Planning](#module-planning)
4. [Core Module Implementation](#core-module-implementation)
   - [Products Module](#products-module)
   - [Categories Module](#categories-module)
5. [Application Configuration](#application-configuration)
6. [Database Integration](#database-integration)
7. [Additional Modules](#additional-modules)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

## Introduction

This guide demonstrates how to build an e-commerce application using the Node.js Modular System with Fastify as the web framework. The modular architecture allows for clean separation of concerns, independent development of features, and scalability.

## Getting Started

### Prerequisites

Before starting, ensure you have the following installed:

- Node.js (v14 or later)
- npm (v6 or later)
- Git

### Project Setup

1. Clone the modular system repository to use as a starting point:

```bash
# Clone the repository
git clone https://github.com/your-username/nodejs-modular-system.git e-commerce-app
cd e-commerce-app

# Remove the example modules but keep the core structure
rm -rf packages/users packages/products
```

2. Update the project configuration in `package.json`:

```json
{
  "name": "e-commerce-app",
  "version": "1.0.0",
  "description": "E-commerce application built with Node.js Modular System",
  "main": "app.js",
  "type": "module",
  "scripts": {
    "start": "node app.js",
    "build": "npm run build:modules",
    "build:modules": "npm run build --workspaces",
    "create-module": "node core/cli/create-module.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [
    "e-commerce",
    "node.js",
    "fastify",
    "modular"
  ],
  "author": "Your Name",
  "license": "MIT",
  "workspaces": [
    "packages/*"
  ],
  "dependencies": {
    "express": "^4.18.2",
    "fastify": "^4.15.0",
    "@fastify/express": "^2.3.0"
  }
}
```

### Framework Configuration

Configure Fastify as the default framework:

1. Create a `.env` file in the project root:

```
FRAMEWORK=fastify
PORT=3000
NODE_ENV=development
```

2. Alternatively, set the framework directly in `app.js`:

```javascript
// At the top of app.js
process.env.FRAMEWORK = 'fastify';
```

## Module Planning

For an e-commerce application, plan the following modules:

| Module | Purpose | Dependencies |
|--------|---------|--------------|
| logger | Application logging | None |
| database | Database connectivity | logger |
| categories | Product categorization | logger, database |
| products | Product catalog management | logger, database, categories |
| users | User management and authentication | logger, database |
| cart | Shopping cart functionality | logger, database, products, users |
| orders | Order processing | logger, database, products, users, cart |
| payments | Payment processing | logger, database, orders |
| shipping | Shipping options and tracking | logger, database, orders |

## Core Module Implementation

### Products Module

1. Create the products module:

```bash
npm run create-module products
```

2. Implement the module in `packages/products/src/index.ts`:

```typescript
/**
 * Products module implementation
 */

// Define the module type
interface ModuleDefinition {
  id: string;
  name: string;
  dependencies?: string[];
  initialize?: (context: any) => void | Promise<void>;
  routes?: (app: any) => void;
  services?: Record<string, any>;
}

// Product type definition
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  categoryId: string;
  stock: number;
  createdAt: Date;
  updatedAt: Date;
}

// In-memory product storage (replace with database in production)
const products: Product[] = [
  {
    id: '1',
    name: 'Smartphone X',
    description: 'Latest smartphone with advanced features',
    price: 999.99,
    imageUrl: '/images/smartphone-x.jpg',
    categoryId: '1',
    stock: 50,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    name: 'Laptop Pro',
    description: 'High-performance laptop for professionals',
    price: 1499.99,
    imageUrl: '/images/laptop-pro.jpg',
    categoryId: '2',
    stock: 25,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Product service implementation
const productService = {
  findById(id: string): Product | undefined {
    return products.find(p => p.id === id);
  },

  getAll(): Product[] {
    return [...products];
  },

  getByCategory(categoryId: string): Product[] {
    return products.filter(p => p.categoryId === categoryId);
  },

  create(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product {
    const id = (products.length + 1).toString();
    const now = new Date();
    const newProduct = {
      id,
      ...productData,
      createdAt: now,
      updatedAt: now
    };
    products.push(newProduct);
    return newProduct;
  },

  update(id: string, productData: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>): Product | undefined {
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return undefined;

    products[index] = {
      ...products[index],
      ...productData,
      updatedAt: new Date()
    };
    return products[index];
  },

  delete(id: string): boolean {
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return false;

    products.splice(index, 1);
    return true;
  }
};

// Products module definition
const productsModule: ModuleDefinition = {
  id: 'products',
  name: 'Products Module',

  // Dependencies
  dependencies: ['logger', 'categories'],

  // Initialize function
  initialize(context) {
    const logger = context.getService('logger');
    logger.info('Products module initialized');
  },

  // Define routes
  routes(app) {
    // Get all products
    app.get('/api/products', (req, res) => {
      return { products: productService.getAll() };
    });

    // Get product by ID
    app.get('/api/products/:id', (req, res) => {
      const id = req.params.id;
      const product = productService.findById(id);

      if (!product) {
        res.status(404);
        return { error: 'Product not found' };
      }

      return { product };
    });

    // Get products by category
    app.get('/api/categories/:categoryId/products', (req, res) => {
      const categoryId = req.params.categoryId;
      return {
        products: productService.getByCategory(categoryId)
      };
    });

    // Create product
    app.post('/api/products', (req, res) => {
      const { name, description, price, imageUrl, categoryId, stock } = req.body;

      if (!name || !price || !categoryId) {
        res.status(400);
        return { error: 'Name, price, and category are required' };
      }

      const newProduct = productService.create({
        name, description, price, imageUrl, categoryId, stock
      });

      res.status(201);
      return { product: newProduct };
    });

    // Update product
    app.put('/api/products/:id', (req, res) => {
      const id = req.params.id;
      const { name, description, price, imageUrl, categoryId, stock } = req.body;

      const updatedProduct = productService.update(id, {
        name, description, price, imageUrl, categoryId, stock
      });

      if (!updatedProduct) {
        res.status(404);
        return { error: 'Product not found' };
      }

      return { product: updatedProduct };
    });

    // Delete product
    app.delete('/api/products/:id', (req, res) => {
      const id = req.params.id;
      const success = productService.delete(id);

      if (!success) {
        res.status(404);
        return { error: 'Product not found' };
      }

      return { success: true };
    });
  },

  // Exposed services
  services: productService
};

export default productsModule;
```

### Categories Module

1. Create the categories module:

```bash
npm run create-module categories
```

2. Implement the module in `packages/categories/src/index.ts`:

```typescript
/**
 * Categories module implementation
 */

interface ModuleDefinition {
  id: string;
  name: string;
  dependencies?: string[];
  initialize?: (context: any) => void | Promise<void>;
  routes?: (app: any) => void;
  services?: Record<string, any>;
}

interface Category {
  id: string;
  name: string;
  description: string;
  parentId?: string;
}

const categories: Category[] = [
  { id: '1', name: 'Electronics', description: 'Electronic devices and gadgets' },
  { id: '2', name: 'Computers', description: 'Laptops, desktops and accessories', parentId: '1' }
];

const categoryService = {
  findById(id: string): Category | undefined {
    return categories.find(c => c.id === id);
  },

  getAll(): Category[] {
    return [...categories];
  },

  create(categoryData: Omit<Category, 'id'>): Category {
    const id = (categories.length + 1).toString();
    const newCategory = { id, ...categoryData };
    categories.push(newCategory);
    return newCategory;
  },

  update(id: string, categoryData: Partial<Omit<Category, 'id'>>): Category | undefined {
    const index = categories.findIndex(c => c.id === id);
    if (index === -1) return undefined;

    categories[index] = { ...categories[index], ...categoryData };
    return categories[index];
  },

  delete(id: string): boolean {
    const index = categories.findIndex(c => c.id === id);
    if (index === -1) return false;

    categories.splice(index, 1);
    return true;
  }
};

const categoriesModule: ModuleDefinition = {
  id: 'categories',
  name: 'Categories Module',
  dependencies: ['logger'],
  initialize(context) {
    const logger = context.getService('logger');
    logger.info('Categories module initialized');
  },
  routes(app) {
    // Get all categories
    app.get('/api/categories', (req, res) => {
      return { categories: categoryService.getAll() };
    });

    // Get category by ID
    app.get('/api/categories/:id', (req, res) => {
      const id = req.params.id;
      const category = categoryService.findById(id);

      if (!category) {
        res.status(404);
        return { error: 'Category not found' };
      }

      return { category };
    });

    // Create category
    app.post('/api/categories', (req, res) => {
      const { name, description, parentId } = req.body;

      if (!name) {
        res.status(400);
        return { error: 'Name is required' };
      }

      const newCategory = categoryService.create({ name, description, parentId });

      res.status(201);
      return { category: newCategory };
    });

    // Update category
    app.put('/api/categories/:id', (req, res) => {
      const id = req.params.id;
      const { name, description, parentId } = req.body;

      const updatedCategory = categoryService.update(id, { name, description, parentId });

      if (!updatedCategory) {
        res.status(404);
        return { error: 'Category not found' };
      }

      return { category: updatedCategory };
    });

    // Delete category
    app.delete('/api/categories/:id', (req, res) => {
      const id = req.params.id;
      const success = categoryService.delete(id);

      if (!success) {
        res.status(404);
        return { error: 'Category not found' };
      }

      return { success: true };
    });
  },
  services: categoryService
};

export default categoriesModule;
```

## Application Configuration

Update `app.js` to register your modules:

```javascript
/**
 * Main application entry point
 */

import { createApp } from './core/src/framework.js';
import { registerModule, initializeModules } from './core/src/modules.js';

// Set Fastify as the framework
process.env.FRAMEWORK = 'fastify';

// Import modules
import loggerModule from './packages/logger/dist/index.js';
import categoriesModule from './packages/categories/dist/index.js';
import productsModule from './packages/products/dist/index.js';
// Import other modules as you create them

async function startApp() {
  try {
    // Create application
    const app = await createApp();

    // Register modules
    registerModule('logger', loggerModule);
    registerModule('categories', categoriesModule);
    registerModule('products', productsModule);
    // Register other modules

    // Initialize all modules
    const context = await initializeModules(app);

    // Add error handler
    app.use((err, req, res, next) => {
      console.error('Application error:', err);
      res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'production' ? undefined : err.message
      });
    });

    // Add 404 handler
    app.use((req, res) => {
      res.status(404).json({ error: 'Not Found' });
    });

    // Start server
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`E-commerce API running on port ${port}`);
      console.log(`Server running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}

startApp();
```

## Database Integration

For a production e-commerce application, integrate with a database:

1. Create a database module:

```bash
npm run create-module database
```

2. Install required dependencies:

```bash
npm install mongoose
npm install --save-dev @types/mongoose
```

3. Implement the database module in `packages/database/src/index.ts`:

```typescript
/**
 * Database module implementation
 */

import mongoose from 'mongoose';

interface ModuleDefinition {
  id: string;
  name: string;
  dependencies?: string[];
  initialize?: (context: any) => void | Promise<void>;
  routes?: (app: any) => void;
  services?: Record<string, any>;
}

// Database connection service
const databaseService = {
  async connect(connectionString: string): Promise<void> {
    await mongoose.connect(connectionString);
  },

  getConnection(): typeof mongoose {
    return mongoose;
  },

  createModel<T>(name: string, schema: mongoose.Schema): mongoose.Model<T> {
    return mongoose.model<T>(name, schema);
  },

  disconnect(): Promise<void> {
    return mongoose.disconnect();
  }
};

const databaseModule: ModuleDefinition = {
  id: 'database',
  name: 'Database Module',
  dependencies: ['logger'],

  async initialize(context) {
    const logger = context.getService('logger');
    logger.info('Database module initializing');

    const connectionString = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce';

    try {
      await databaseService.connect(connectionString);
      logger.info('Database connected successfully');
    } catch (error) {
      logger.error('Database connection failed', error);
      throw error;
    }
  },

  services: databaseService
};

export default databaseModule;
```

4. Update the products module to use the database:

```typescript
// In packages/products/src/index.ts

// Add to dependencies
dependencies: ['logger', 'categories', 'database'],

// In initialize function
initialize(context) {
  const logger = context.getService('logger');
  const db = context.getService('database');

  // Create product schema
  const productSchema = new db.getConnection().Schema({
    name: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    imageUrl: String,
    categoryId: { type: String, required: true },
    stock: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  });

  // Create model
  this.ProductModel = db.createModel('Product', productSchema);

  logger.info('Products module initialized');
}
```

## Additional Modules

Continue building your e-commerce application by implementing these additional modules:

### Users Module

```bash
npm run create-module users
```

Key features:
- User registration and authentication
- Profile management
- Address management
- Role-based permissions

### Cart Module

```bash
npm run create-module cart
```

Key features:
- Add/remove products
- Update quantities
- Calculate totals
- Save carts for logged-in users

### Orders Module

```bash
npm run create-module orders
```

Key features:
- Create orders from cart
- Order status management
- Order history
- Invoice generation

### Payments Module

```bash
npm run create-module payments
```

Key features:
- Payment gateway integration
- Payment processing
- Transaction history
- Refund handling

### Shipping Module

```bash
npm run create-module shipping
```

Key features:
- Shipping options
- Shipping cost calculation
- Tracking integration
- Delivery status updates

## Best Practices

1. **Module Independence**: Design modules to be as independent as possible
2. **Clear Dependencies**: Explicitly declare module dependencies
3. **Service Interfaces**: Define clear interfaces for services exposed by modules
4. **Error Handling**: Implement consistent error handling across modules
5. **Validation**: Validate input data at the module boundaries
6. **Testing**: Write tests for each module independently
7. **Documentation**: Document module interfaces and dependencies
8. **Configuration**: Use environment variables for configuration

## Troubleshooting

### Common Issues

1. **Module Initialization Order**

If modules fail to initialize due to dependency issues:
- Check that all dependencies are correctly listed in the module definition
- Ensure all dependent modules are registered before initialization

2. **Framework Compatibility**

If you encounter framework-specific issues:
- Ensure route handlers return data objects instead of using `res.json()`
- Check that middleware is compatible with both Express and Fastify

3. **TypeScript Compilation Errors**

If TypeScript fails to compile:
- Check that all type definitions are correct
- Ensure `tsconfig.json` is properly configured
- Run `npm run build` to see detailed error messages

4. **Database Connection Issues**

If database connections fail:
- Verify connection string is correct
- Check that the database server is running
- Ensure network connectivity to the database server
