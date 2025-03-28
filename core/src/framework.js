/**
 * Framework adapter for Node.js applications
 * Supports Express by default with ability to switch to other frameworks
 */

/**
 * Create an application instance with the configured framework
 * @returns {Promise<object>} Application instance
 */
export async function createApp() {
  const framework = process.env.FRAMEWORK || 'express';

  if (framework === 'fastify') {
    return createFastifyApp();
  } else {
    return createExpressApp();
  }
}

/**
 * Create an Express application
 * @returns {Promise<object>} Express application
 */
async function createExpressApp() {
  const express = (await import('express')).default;
  const app = express();

  // Basic middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  return app;
}

/**
 * Create a Fastify application with Express compatibility layer
 * @returns {Promise<object>} Fastify application with Express-like interface
 */
async function createFastifyApp() {
  const Fastify = (await import('fastify')).default;
  const fastify = Fastify({ logger: true });

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
    listen: (port, callback) => fastify.listen({ port }, callback)
  };

  // Add JSON middleware
  expressLayer.use(express.json());

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
