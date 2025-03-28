/**
 * Main application entry point
 */

import { createApp } from './core/src/framework.js';
import { registerModule, initializeModules } from './core/src/modules.js';

// Import modules
import loggerModule from './packages/logger/dist/index.js';
import usersModule from './packages/users/dist/index.js';
import productsModule from './packages/products/dist/index.js';

async function startApp() {
  try {
    // Create application
    const app = await createApp();

    // Register modules
    registerModule('logger', loggerModule);
    registerModule('users', usersModule);
    registerModule('products', productsModule);

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
      console.log(`Server running on port ${port}`);
      console.log(`Try these endpoints:
- GET http://localhost:${port}/api/users
- GET http://localhost:${port}/api/users/1
- POST http://localhost:${port}/api/users (with JSON body: {"name": "New User", "email": "user@example.com"})
- PUT http://localhost:${port}/api/users/1 (with JSON body: {"name": "Updated Name"})
- DELETE http://localhost:${port}/api/users/2
      `);
    });
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}

startApp();
