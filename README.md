# Node.js Modular System

A lightweight, modular system for Node.js applications with a hybrid approach using ECMAScript for the core and TypeScript for packages.

## Architecture Overview

The Node.js Modular System is designed around a core-and-modules architecture that promotes separation of concerns, code reusability, and maintainability. The architecture consists of:

1. **Core System**: Written in ECMAScript (JavaScript), the core provides the fundamental infrastructure:
   - Module registration and lifecycle management
   - Dependency resolution and initialization
   - Framework abstraction layer
   - Service discovery mechanism

2. **Module Packages**: Written in TypeScript, modules encapsulate specific functionality:
   - Each module is self-contained with its own configuration
   - Modules declare dependencies on other modules
   - Modules expose services for other modules to consume
   - Modules can define routes for API endpoints

3. **Framework Adapter**: Provides a consistent interface regardless of the underlying web framework:
   - Abstracts framework-specific details
   - Allows switching between Express and Fastify
   - Maintains consistent API for route handlers
   - Handles middleware and error management

4. **Application Context**: Serves as the runtime environment for modules:
   - Provides access to services from other modules
   - Manages configuration
   - Facilitates inter-module communication

## Core Principles

The Node.js Modular System is built on several key principles:

1. **Modularity**: Each piece of functionality is encapsulated in a self-contained module that can be developed, tested, and deployed independently.

2. **Explicit Dependencies**: Modules must explicitly declare their dependencies, enabling proper initialization order and preventing hidden coupling.

3. **Interface-Based Design**: Modules interact through well-defined interfaces (services), not implementation details.

4. **Framework Agnosticism**: Business logic is separated from the web framework, allowing for framework changes without affecting module functionality.

5. **Progressive Disclosure**: Simple use cases are straightforward, while advanced scenarios are possible without added complexity for basic users.

6. **Type Safety**: TypeScript is used for modules to provide type checking, better tooling, and improved developer experience.

7. **Standardized Structure**: Consistent module structure makes the system easier to learn and navigate.

## Key Benefits

The modular architecture provides several advantages:

1. **Scalable Development**: Multiple teams can work on different modules simultaneously without stepping on each other's toes.

2. **Maintainable Codebase**: Smaller, focused modules are easier to understand, test, and maintain.

3. **Flexible Deployment**: Modules can be deployed together as a monolith or separately as microservices.

4. **Framework Flexibility**: Switch between Express and Fastify (or add support for other frameworks) without rewriting business logic.

5. **Incremental Adoption**: Start with a few modules and add more as needed, without major refactoring.

6. **Reusable Components**: Modules can be shared across projects or published to npm.

7. **Clear Boundaries**: Well-defined module interfaces prevent tight coupling and make the system more robust.

## Rationale

This system was developed to address common challenges in Node.js application development:

1. **Monolithic Complexity**: As Node.js applications grow, they often become unwieldy monoliths. This system provides structure without sacrificing flexibility.

2. **Framework Lock-in**: Many applications become tightly coupled to their web framework. This system's abstraction layer reduces switching costs.

3. **TypeScript Integration**: While TypeScript offers many benefits, integrating it into existing JavaScript projects can be challenging. This hybrid approach allows for incremental adoption.

4. **Dependency Management**: Managing dependencies between different parts of an application is often ad-hoc. This system formalizes dependency declaration and resolution.

5. **Service Discovery**: Finding and using services provided by different parts of an application typically relies on imports or global objects. This system provides a structured service discovery mechanism.

6. **Consistent Patterns**: Teams often struggle to maintain consistent patterns across a codebase. This system enforces a standard structure while allowing flexibility within modules.

## Features

- **Simple Module System**: Easy-to-understand module registration and initialization
- **Framework Agnostic**: Works with Express by default, but can be adapted to other frameworks
- **Dependency Management**: Modules can declare dependencies on other modules
- **Service Discovery**: Modules can expose and consume services from other modules
- **TypeScript Support**: Packages are written in TypeScript for type safety and better developer experience
- **Publishable Packages**: Each package can be published to npm independently

## Project Structure

```
nodejs-modular-system/
├── core/                      # Core system (ECMAScript)
│   └── src/
│       ├── modules.js         # Module registration and initialization
│       └── framework.js       # Framework adapter
│
├── packages/                  # Module packages (TypeScript)
│   ├── logger/                # Logger module
│   │   ├── src/
│   │   │   └── index.ts       # Module implementation
│   │   ├── package.json       # Package configuration
│   │   └── tsconfig.json      # TypeScript configuration
│   │
│   ├── users/                 # Users module
│   │   ├── src/
│   │   │   └── index.ts       # Module implementation
│   │   ├── package.json       # Package configuration
│   │   └── tsconfig.json      # TypeScript configuration
│   │
│   └── products/              # Products module
│       ├── src/
│       │   └── index.ts       # Module implementation
│       ├── package.json       # Package configuration
│       └── tsconfig.json      # TypeScript configuration
│
├── app.js                     # Main application entry point
└── package.json               # Project configuration
```

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Build the TypeScript packages:

```bash
npm run build
```

3. Start the application:

```bash
npm start
```

The server will start on port 3000 by default.

## Available Endpoints

- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create a new user
- `PUT /api/users/:id` - Update a user
- `DELETE /api/users/:id` - Delete a user
- `GET /api/products` - Get products information

## Creating a New Module

You can use the CLI tool to create a new module:

```bash
npm run create-module my-module
```

Or manually create a new directory in the `packages` folder:

```bash
mkdir -p packages/my-module/src
```

2. Create a `package.json` file:

```json
{
  "name": "@nodejs-modular-system/my-module",
  "version": "1.0.0",
  "description": "My module for the modular system",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "test": "jest"
  },
  "keywords": [
    "module"
  ],
  "author": "",
  "license": "MIT",
  "devDependencies": {
    "@types/node": "^18.15.11",
    "typescript": "^5.0.4"
  }
}
```

3. Create a `tsconfig.json` file:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "declaration": true,
    "outDir": "dist",
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

4. Create a module implementation in `src/index.ts`:

```typescript
/**
 * My module implementation
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

// My module definition
const myModule: ModuleDefinition = {
  id: 'my-module',
  name: 'My Module',

  // Dependencies
  dependencies: ['logger'],

  // Initialize function
  initialize(context) {
    const logger = context.getService('logger');
    logger.info('My module initialized');
  },

  // Define routes
  routes(app) {
    app.get('/api/my-module', (req, res) => {
      return { message: 'Hello from my module!' };
    });
  },

  // Exposed services
  services: {
    doSomething(data) {
      return `Processed: ${data}`;
    }
  }
};

export default myModule;
```

5. Register your module in `app.js`:

```javascript
import myModule from './packages/my-module/dist/index.js';
registerModule('my-module', myModule);
```

## Publishing Packages

Each package can be published to npm independently:

```bash
cd packages/my-module
npm publish
```

## Environment Variables

The system uses environment variables for configuration. A sample `.env.example` file is provided:

1. Copy the example file to create your own configuration:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file to customize your settings:
   ```
   PORT=3000
   FRAMEWORK=express
   DEBUG=true
   NODE_ENV=development
   ```

3. The environment variables are used in both:
   - Direct application execution via `npm start`
   - Docker Compose configuration for containerized development

Available environment variables:

- `PORT`: Server port (default: 3000)
- `FRAMEWORK`: Web framework to use ('express' or 'fastify', default: 'express')
- `DEBUG`: Enable debug logging (any value)
- `NODE_ENV`: Environment ('development', 'production', etc.)
- `MONGODB_URI`: MongoDB connection string (for modules that use MongoDB)

## Additional Documentation

- [E-commerce Application Guide](docs/e-commerce-guide.md) - Step-by-step guide for building an e-commerce application using this modular system with Fastify
