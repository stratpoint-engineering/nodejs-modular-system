/**
 * Simple module system for Node.js applications
 */

const modules = {};
const initialized = new Set();

/**
 * Register a module with the system
 * @param {string} name - Unique module name
 * @param {object} module - Module implementation
 * @returns {object} The registered module
 */
export function registerModule(name, module) {
  if (modules[name]) {
    console.warn(`Module ${name} is already registered. Skipping.`);
    return modules[name];
  }

  modules[name] = module;
  console.log(`Registered module: ${name}`);
  return module;
}

/**
 * Get a registered module by name
 * @param {string} name - Module name
 * @returns {object|undefined} The module or undefined if not found
 */
export function getModule(name) {
  return modules[name];
}

/**
 * Initialize a single module and its dependencies
 * @param {string} name - Module name
 * @param {object} context - Application context
 * @returns {Promise<void>}
 */
async function initializeModule(name, context) {
  // Skip if already initialized
  if (initialized.has(name)) {
    return;
  }

  const module = modules[name];
  if (!module) {
    throw new Error(`Module ${name} not found`);
  }

  // Initialize dependencies first
  if (module.dependencies && Array.isArray(module.dependencies)) {
    for (const dep of module.dependencies) {
      await initializeModule(dep, context);
    }
  }

  // Initialize the module
  if (typeof module.initialize === 'function') {
    await Promise.resolve(module.initialize(context));
  }

  // Register routes if available
  if (typeof module.routes === 'function' && context.app) {
    module.routes(context.app);
  }

  // Register services
  if (module.services) {
    context.services[name] = module.services;
  }

  // Mark as initialized
  initialized.add(name);
  console.log(`Initialized module: ${name}`);
}

/**
 * Initialize all registered modules
 * @param {object} app - Express or compatible app instance
 * @param {object} config - Application configuration
 * @returns {Promise<object>} The application context
 */
export async function initializeModules(app, config = {}) {
  const context = {
    app,
    services: {},
    config,
    getService: (moduleName, serviceName) => {
      const moduleServices = context.services[moduleName];
      if (!moduleServices) {
        return undefined;
      }

      return serviceName ? moduleServices[serviceName] : moduleServices;
    }
  };

  // Initialize each module
  for (const name of Object.keys(modules)) {
    await initializeModule(name, context);
  }

  return context;
}
