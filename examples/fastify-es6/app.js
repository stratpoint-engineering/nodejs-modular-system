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
