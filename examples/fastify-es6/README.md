# Building a Fastify Application with @stratpoint/core and ES6 Modules

This guide will walk you through creating a modern Node.js application using Fastify with ES6 modules and the @stratpoint/core modular system.

## Overview

Fastify is a high-performance, low overhead web framework for Node.js that's becoming increasingly popular. Combined with ES6 modules and the @stratpoint/core modular system, you can build well-structured, maintainable applications.

## Prerequisites

- Node.js v14+ (for ES modules support)
- npm or yarn
- Basic knowledge of Fastify and ES6 modules

## Step 1: Initialize Your Project

First, create a new directory and initialize a package.json file:

```bash
mkdir fastify-modular-app
cd fastify-modular-app
npm init -y
```

Update your package.json to specify that we're using ES modules:

```json
{
  "name": "fastify-modular-app",
  "version": "1.0.0",
  "description": "A modular Fastify app",
  "main": "app.js",
  "type": "module",  // Add this line to use ES modules
  "scripts": {
    "start": "node app.js",
    "dev": "nodemon app.js"
  },
  "keywords": [],
  "author": "",
  "license": "ISC"
}
```

## Step 2: Install Dependencies

Install the core libraries:

```bash
npm install fastify @fastify/cors @fastify/helmet @fastify/swagger @fastify/env
npm install @stratpoint/core @stratpoint/fastify-adapter
```

Install development dependencies:

```bash
npm install nodemon --save-dev
```

## Step 3: Set Up Project Structure

Create the following directory structure:

```
fastify-modular-app/
├── app.js                  # Entry point
├── modules/                # Directory for modules
│   ├── logger/             # Logger module
│   ├── database/           # Database module
│   ├── auth/               # Auth module
│   └── user/               # User module
├── config/                 # Configuration
│   └── config.js           # Config export
├── package.json
└── .env                    # Environment variables
```

## Step 4: Create .env File

Create a .env file in the root directory:

```
PORT=3000
NODE_ENV=development
DATABASE_URL=mongodb://localhost:27017/modular-app
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1d
```

## Step 5: Create Configuration Module

Create a `config/config.js` file:

```javascript
export default {
  database: {
    url: process.env.DATABASE_URL || 'mongodb://localhost:27017/modular-app',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d'
  },
  logger: {
    level: process.env.LOG_LEVEL || 'info'
  }
};
```

## Step 6: Create Bootstrap File

Create your main `app.js` file:

```javascript
/**
 * Fastify ES6 bootstrapper for @stratpoint/core modular system
 */

// Standard imports
import Fastify from 'fastify';
import fastifySwagger from '@fastify/swagger';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyEnv from '@fastify/env';
import path from 'path';
import { fileURLToPath } from 'url';

// Core system imports
import { registerModule, initializeModules } from '@stratpoint/core';
import { createFastifyAdapter } from '@stratpoint/fastify-adapter';

// Import modules
import loggerModule from './modules/logger/index.js';
import databaseModule from './modules/database/index.js';
import authModule from './modules/auth/index.js';
import userModule from './modules/user/index.js';

// Import configuration
import config from './config/config.js';

// Get directory path for ES modules (equivalent to __dirname in CommonJS)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Fastify instance
const fastify = Fastify({
  logger: true,
  trustProxy: true
});

// Define environment schema
const schema = {
  type: 'object',
  required: ['PORT'],
  properties: {
    PORT: {
      type: 'string',
      default: '3000'
    },
    NODE_ENV: {
      type: 'string',
      default: 'development'
    }
  }
};

// Register Fastify plugins
async function registerPlugins() {
  // Load environment variables
  await fastify.register(fastifyEnv, {
    schema,
    dotenv: true,
    data: process.env
  });

  // Security headers
  await fastify.register(fastifyHelmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"]
      }
    }
  });

  // CORS
  await fastify.register(fastifyCors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
  });

  // API documentation
  if (fastify.config.NODE_ENV === 'development') {
    await fastify.register(fastifySwagger, {
      routePrefix: '/documentation',
      swagger: {
        info: {
          title: 'Modular API',
          description: 'API documentation',
          version: '1.0.0'
        },
        externalDocs: {
          url: 'https://swagger.io',
          description: 'Find more info here'
        },
        host: `localhost:${fastify.config.PORT}`,
        schemes: ['http'],
        consumes: ['application/json'],
        produces: ['application/json']
      },
      exposeRoute: true
    });
  }
}

// Bootstrapping the application with modular system
async function bootstrap() {
  try {
    // Register Fastify plugins
    await registerPlugins();

    // Create adapter for the modular system
    const app = createFastifyAdapter(fastify);

    // Register modules
    registerModule('logger', loggerModule);
    registerModule('database', databaseModule);
    registerModule('auth', authModule);
    registerModule('user', userModule);

    // Initialize all modules
    const context = await initializeModules(app, config);

    // Get logger service from the context
    const logger = context.getService('logger');

    // Global error handler
    fastify.setErrorHandler((error, request, reply) => {
      logger.error(`Error occurred: ${error.message}`, error);

      // Don't expose internal errors in production
      const message = fastify.config.NODE_ENV === 'production'
        ? 'Internal Server Error'
        : error.message;

      reply.status(error.statusCode || 500).send({
        error: error.name || 'InternalServerError',
        message,
        statusCode: error.statusCode || 500
      });
    });

    // Not Found handler
    fastify.setNotFoundHandler((request, reply) => {
      reply.status(404).send({
        error: 'NotFound',
        message: 'Route not found',
        statusCode: 404
      });
    });

    // Start the server
    const port = parseInt(fastify.config.PORT, 10);
    const address = await fastify.listen({ port, host: '0.0.0.0' });
    logger.info(`Server listening at ${address}`);

  } catch (error) {
    fastify.log.error(`Error bootstrapping application: ${error}`);
    process.exit(1);
  }
}

// Run the bootstrap function
bootstrap();
```

## Step 7: Create Modules

Now we'll create each module one by one:

### Logger Module

Create `modules/logger/index.js`:

```javascript
/**
 * Logger Module
 * A simple logger module using Pino (which Fastify uses internally)
 */

const loggerModule = {
  id: 'logger',
  name: 'Logger Module',
  dependencies: [],

  initialize(context) {
    // Configuration options
    const config = context.config.logger || {};
    this.level = config.level || 'info';

    console.log('Logger module initialized');
  },

  services: {
    debug(message, ...args) {
      if (this.level === 'debug') {
        console.debug(`[DEBUG] ${message}`, ...args);
      }
    },

    info(message, ...args) {
      console.log(`[INFO] ${message}`, ...args);
    },

    warn(message, ...args) {
      console.warn(`[WARN] ${message}`, ...args);
    },

    error(message, error, ...args) {
      console.error(`[ERROR] ${message}`, error || '', ...args);
    }
  }
};

export default loggerModule;
```

### Database Module

Create `modules/database/index.js`:

```javascript
/**
 * Database Module
 * Example using MongoDB, but can be replaced with any database
 */
import { MongoClient } from 'mongodb';

const databaseModule = {
  id: 'database',
  name: 'Database Module',
  dependencies: ['logger'],

  async initialize(context) {
    this.logger = context.getService('logger');
    this.config = context.config.database || {};

    try {
      this.logger.info('Connecting to database...');

      // Connect to MongoDB
      this.client = new MongoClient(this.config.url, this.config.options);
      await this.client.connect();

      // Get database
      this.db = this.client.db();

      this.logger.info('Database connection established');
    } catch (error) {
      this.logger.error('Database connection failed', error);
      throw error; // Rethrow to prevent application startup
    }
  },

  routes(app) {
    // No routes for database module
  },

  services: {
    // Expose collections
    collection(name) {
      return this.db.collection(name);
    },

    // Create a simple repository for a collection
    createRepository(collectionName) {
      const collection = this.db.collection(collectionName);

      return {
        findAll: (query = {}) => collection.find(query).toArray(),
        findOne: (query) => collection.findOne(query),
        findById: (id) => collection.findOne({ _id: id }),
        create: (data) => collection.insertOne(data),
        update: (id, data) => collection.updateOne({ _id: id }, { $set: data }),
        delete: (id) => collection.deleteOne({ _id: id })
      };
    }
  }
};

export default databaseModule;
```

### Auth Module

Create `modules/auth/index.js`:

```javascript
/**
 * Auth Module
 * Handles authentication and authorization
 */
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const authModule = {
  id: 'auth',
  name: 'Auth Module',
  dependencies: ['logger', 'database'],

  async initialize(context) {
    this.logger = context.getService('logger');
    this.db = context.getService('database');
    this.config = context.config.auth || {};

    // Create users collection if not exists
    this.users = this.db.collection('users');

    this.logger.info('Auth module initialized');
  },

  routes(app) {
    app.post('/auth/login', this.handleLogin.bind(this));
    app.post('/auth/register', this.handleRegister.bind(this));
    app.get('/auth/me', this.authenticateRequest.bind(this), this.handleGetCurrentUser.bind(this));
  },

  async handleLogin(request, reply) {
    const { email, password } = request.body;

    try {
      // Find user by email
      const user = await this.users.findOne({ email });

      if (!user) {
        reply.status(401);
        return { error: 'Invalid credentials' };
      }

      // Check password
      const isValid = await bcrypt.compare(password, user.password);

      if (!isValid) {
        reply.status(401);
        return { error: 'Invalid credentials' };
      }

      // Generate token
      const token = this.generateToken(user);

      // Return user info and token
      return {
        user: {
          id: user._id,
          email: user.email,
          name: user.name
        },
        token
      };
    } catch (error) {
      this.logger.error('Login error', error);
      throw error;
    }
  },

  async handleRegister(request, reply) {
    const { email, password, name } = request.body;

    try {
      // Check if user already exists
      const existingUser = await this.users.findOne({ email });

      if (existingUser) {
        reply.status(400);
        return { error: 'User already exists' };
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const result = await this.users.insertOne({
        email,
        password: hashedPassword,
        name,
        createdAt: new Date()
      });

      // Generate token
      const user = { _id: result.insertedId, email, name };
      const token = this.generateToken(user);

      // Return user info and token
      reply.status(201);
      return {
        user: {
          id: result.insertedId,
          email,
          name
        },
        token
      };
    } catch (error) {
      this.logger.error('Registration error', error);
      throw error;
    }
  },

  async handleGetCurrentUser(request, reply) {
    // User is available from authenticateRequest middleware
    const { user } = request;

    return {
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      }
    };
  },

  // Authentication middleware
  async authenticateRequest(request, reply) {
    try {
      const token = this.extractToken(request);

      if (!token) {
        reply.status(401);
        return reply.send({ error: 'Authentication required' });
      }

      const decoded = this.verifyToken(token);

      // Find user
      const user = await this.users.findOne({ _id: decoded.userId });

      if (!user) {
        reply.status(401);
        return reply.send({ error: 'Invalid token' });
      }

      // Attach user to request
      request.user = user;

      // Continue
      return;
    } catch (error) {
      reply.status(401);
      return reply.send({ error: 'Authentication failed' });
    }
  },

  // Helper methods
  generateToken(user) {
    return jwt.sign(
      { userId: user._id },
      this.config.jwtSecret,
      { expiresIn: this.config.expiresIn }
    );
  },

  verifyToken(token) {
    return jwt.verify(token, this.config.jwtSecret);
  },

  extractToken(request) {
    const authHeader = request.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return null;
  },

  // Services exposed to other modules
  services: {
    authenticateRequest(request, reply) {
      return this.authenticateRequest(request, reply);
    },

    verifyToken(token) {
      return this.verifyToken(token);
    },

    hasPermission(user, permission) {
      // Implement permission checking logic
      return true;
    }
  }
};

export default authModule;
```

### User Module

Create `modules/user/index.js`:

```javascript
/**
 * User Module
 * Handles user-related functionality
 */

const userModule = {
  id: 'user',
  name: 'User Module',
  dependencies: ['logger', 'database', 'auth'],

  initialize(context) {
    this.logger = context.getService('logger');
    this.db = context.getService('database');
    this.auth = context.getService('auth');

    // Create users repository
    this.userRepository = this.db.createRepository('users');

    this.logger.info('User module initialized');
  },

  routes(app) {
    app.get('/api/users', this.auth.authenticateRequest, this.listUsers.bind(this));
    app.get('/api/users/:id', this.auth.authenticateRequest, this.getUserById.bind(this));
    app.put('/api/users/:id', this.auth.authenticateRequest, this.updateUser.bind(this));
  },

  async listUsers(request, reply) {
    try {
      // Omit password field
      const users = await this.userRepository.findAll();

      return {
        users: users.map(user => ({
          id: user._id,
          name: user.name,
          email: user.email
        }))
      };
    } catch (error) {
      this.logger.error('Error listing users', error);
      throw error;
    }
  },

  async getUserById(request, reply) {
    try {
      const { id } = request.params;
      const user = await this.userRepository.findById(id);

      if (!user) {
        reply.status(404);
        return { error: 'User not found' };
      }

      return {
        user: {
          id: user._id,
          name: user.name,
          email: user.email
        }
      };
    } catch (error) {
      this.logger.error(`Error getting user ${request.params.id}`, error);
      throw error;
    }
  },

  async updateUser(request, reply) {
    try {
      const { id } = request.params;
      const updateData = request.body;

      // Prevent updating sensitive fields
      delete updateData.password;
      delete updateData._id;

      // Find user first
      const user = await this.userRepository.findById(id);

      if (!user) {
        reply.status(404);
        return { error: 'User not found' };
      }

      // Check if user is updating their own profile
      if (request.user._id.toString() !== id) {
        reply.status(403);
        return { error: 'Not authorized to update this user' };
      }

      // Update user
      await this.userRepository.update(id, updateData);

      // Get updated user
      const updatedUser = await this.userRepository.findById(id);

      return {
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email
        }
      };
    } catch (error) {
      this.logger.error(`Error updating user ${request.params.id}`, error);
      throw error;
    }
  },

  // Services exposed to other modules
  services: {
    async findUserById(id) {
      return this.userRepository.findById(id);
    },

    async findUserByEmail(email) {
      return this.userRepository.findOne({ email });
    }
  }
};

export default userModule;
```

## Step 8: Install Additional Dependencies

Some of our modules need additional packages:

```bash
npm install mongodb bcrypt jsonwebtoken
```

## Step 9: Run the Application

Now you can start your application:

```bash
npm run dev
```

The server should start on port 3000 (or whatever you configured in .env).

## How It Works

Let's understand the main concepts:

### 1. Module System

The core of this architecture is the `@stratpoint/core` module system. Each module:

- Has a unique ID
- Declares its dependencies
- Has an initialization function
- Can register routes
- Exposes services to other modules

### 2. Fastify Integration

The `@stratpoint/fastify-adapter` provides a bridge between Fastify and the modular system:

- It wraps the Fastify instance
- It provides a common interface for registering routes
- It handles the translation between the modular system and Fastify's API

### 3. ES6 Modules

We're using ES6 modules throughout this application:

- `import`/`export` syntax instead of CommonJS `require()`
- Each module is a separate file
- Using `fileURLToPath` for path operations (since `__dirname` isn't available in ES modules)

### 4. Dependency Resolution

The core system manages dependencies between modules:

- Modules explicitly declare which other modules they depend on
- The system initializes modules in the correct order based on these dependencies
- This prevents circular dependencies and ensures that modules are initialized properly

## Best Practices

### Module Organization

Each module should:

- Be focused on a specific domain or responsibility
- Keep its implementation details private
- Expose a clean API through its services
- Be testable in isolation

### Error Handling

Use proper error handling:

- Log errors with appropriate context
- Don't expose internal error details in production
- Use HTTP status codes correctly
- Provide useful error messages

### Configuration

- Use environment variables for environment-specific configuration
- Provide sensible defaults
- Validate configuration at startup

### Security

- Always hash passwords before storing them
- Use proper authentication mechanisms (like JWT)
- Implement authorization checks
- Set security headers with Helmet

## Advanced Usage

### Adding Swagger Documentation

To document your API endpoints properly:

```javascript
app.get('/api/users', {
  schema: {
    tags: ['users'],
    summary: 'List all users',
    response: {
      200: {
        type: 'object',
        properties: {
          users: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' }
              }
            }
          }
        }
      }
    }
  },
  handler: this.listUsers.bind(this)
});
```

### Testing

For unit testing modules, you can create a testing utility:

```javascript
// test-utils.js
export function createTestContext(moduleServices = {}) {
  return {
    services: moduleServices,
    config: {},
    getService(name, service) {
      return service ? moduleServices[name]?.[service] : moduleServices[name];
    }
  };
}
```

Then in your tests:

```javascript
import { createTestContext } from './test-utils.js';
import userModule from '../modules/user/index.js';

describe('User Module', () => {
  let context;

  beforeEach(() => {
    // Create mock services
    const loggerMock = { info: jest.fn(), error: jest.fn() };
    const dbMock = {
      createRepository: jest.fn(() => ({
        findAll: jest.fn().mockResolvedValue([]),
        findById: jest.fn().mockResolvedValue(null)
      }))
    };

    // Create test context
    context = createTestContext({
      logger: loggerMock,
      database: dbMock,
      auth: { authenticateRequest: jest.fn() }
    });

    // Initialize module
    userModule.initialize(context);
  });

  test('should list users', async () => {
    // Test implementation
  });
});
```

## Conclusion

You now have a modern, modular Fastify application using ES6 modules and the @stratpoint/core system. This architecture provides:

- Clear separation of concerns
- Explicit dependencies between modules
- Well-defined interfaces for module communication
- Framework independence (the business logic isn't tied to Fastify)
- Maintainability and testability

As your application grows, you can add more modules without increasing complexity, and each module can evolve independently as long as it maintains its interface.
