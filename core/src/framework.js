/**
 * Framework adapter for Node.js applications
 * Supports Express by default with ability to switch to other frameworks
 *
 * This adapter provides a thin abstraction layer that allows modules to work
 * with different web frameworks without being tightly coupled to them.
 * It preserves direct access to the underlying framework's features.
 */

/**
 * Create an application instance with the configured framework
 * @param {object} options - Framework options
 * @returns {Promise<object>} Application instance
 */
export async function createApp(options = {}) {
  const framework = options.framework || process.env.FRAMEWORK || 'express';

  if (framework === 'fastify') {
    return createFastifyApp(options);
  } else {
    return createExpressApp(options);
  }
}

/**
 * Create an Express application
 * @param {object} options - Express options
 * @returns {Promise<object>} Express application
 */
async function createExpressApp(options = {}) {
  const express = (await import('express')).default;
  const app = express();

  // Basic middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Add CORS if enabled
  if (options.cors) {
    const cors = (await import('cors')).default;
    app.use(cors(typeof options.cors === 'object' ? options.cors : {}));
  }

  // Add compression if enabled
  if (options.compression) {
    const compression = (await import('compression')).default;
    app.use(compression());
  }

  // Add helmet if enabled
  if (options.helmet) {
    const helmet = (await import('helmet')).default;
    app.use(helmet(typeof options.helmet === 'object' ? options.helmet : {}));
  }

  return app;
}

/**
 * Create a Fastify application with Express compatibility layer
 * @param {object} options - Fastify options
 * @returns {Promise<object>} Fastify application with Express-like interface
 */
async function createFastifyApp(options = {}) {
  const Fastify = (await import('fastify')).default;
  const fastifyOptions = {
    logger: options.logger ?? true,
    ...options.fastify
  };

  const fastify = Fastify(fastifyOptions);

  // Add Express compatibility layer
  await fastify.register(import('@fastify/express'));

  const express = (await import('express')).default;

  // Create Express-like interface
  const expressLayer = {
    use: (...args) => fastify.use(...args),
    get: (path, handler) => fastify.get(path, wrapHandler(handler)),
    post: (path, handler) => fastify.post(path, wrapHandler(handler)),
    put: (path, handler) => fastify.put(path, wrapHandler(handler)),
    delete: (path, handler) => fastify.delete(path, wrapHandler(handler)),
    patch: (path, handler) => fastify.patch(path, wrapHandler(handler)),
    options: (path, handler) => fastify.options(path, wrapHandler(handler)),
    head: (path, handler) => fastify.head(path, wrapHandler(handler)),
    listen: (port, callback) => fastify.listen({ port }, callback),

    // Provide direct access to the underlying Fastify instance
    _raw: fastify
  };

  // Add JSON middleware
  expressLayer.use(express.json());
  expressLayer.use(express.urlencoded({ extended: true }));

  // Add CORS if enabled
  if (options.cors) {
    const cors = (await import('cors')).default;
    expressLayer.use(cors(typeof options.cors === 'object' ? options.cors : {}));
  }

  // Add helmet if enabled
  if (options.helmet) {
    const helmet = (await import('helmet')).default;
    expressLayer.use(helmet(typeof options.helmet === 'object' ? options.helmet : {}));
  }

  return expressLayer;
}

/**
 * Wrap an Express handler for Fastify
 * @param {Function} expressHandler - Express route handler
 * @returns {Function} Fastify compatible handler
 */
function wrapHandler(expressHandler) {
  return async (request, reply) => {
    // Create Express-like req/res
    const req = {
      ...request,
      body: request.body,
      query: request.query,
      params: request.params
    };

    const res = {
      json: (data) => reply.send(data),
      status: (code) => { reply.code(code); return res; },
      send: (data) => reply.send(data)
    };

    await expressHandler(req, res);
  };
}

/**
 * Create a standard route handler with error handling
 * @param {Function} fn - Handler function
 * @returns {Function} Express middleware function
 */
export function createHandler(fn) {
  return async (req, res, next) => {
    try {
      const result = await fn(req, res);

      if (result !== undefined && !res.headersSent) {
        res.json(result);
      }
    } catch (error) {
      next(error);
    }
  };
}
