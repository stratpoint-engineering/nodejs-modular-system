/**
 * Enhanced module system for Node.js applications
 *
 * This system provides a way to register modules, manage their dependencies,
 * and initialize them in the correct order with lifecycle management.
 */

const modules = {};
const initialized = new Set();
const lifecycleHooks = {};

/**
 * Register a module with the system
 *
 * @param {string} name - Unique module name
 * @param {object} module - Module implementation
 * @returns {object} The registered module
 * @throws {Error} If the module is invalid
 */
export function registerModule(name, module) {
  // Validate module
  if (!name || typeof name !== 'string') {
    throw new Error('Module name must be a non-empty string');
  }

  if (!module || typeof module !== 'object') {
    throw new Error('Module must be a valid object');
  }

  if (!module.id || !module.name) {
    throw new Error('Module must have id and name properties');
  }

  // Check if module is already registered
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
 *
 * @param {string} name - Module name
 * @returns {object|undefined} The module or undefined if not found
 */
export function getModule(name) {
  return modules[name];
}

/**
 * Get all registered modules
 *
 * @returns {object} An object containing all registered modules
 */
export function getAllModules() {
  return { ...modules };
}

/**
 * Register a lifecycle hook for a specific event
 *
 * @param {string} event - Lifecycle event name (e.g., 'beforeInit', 'afterInit', 'beforeShutdown')
 * @param {Function} callback - Function to call when the event occurs
 * @returns {void}
 */
export function registerLifecycleHook(event, callback) {
  if (!lifecycleHooks[event]) {
    lifecycleHooks[event] = [];
  }

  lifecycleHooks[event].push(callback);
}

/**
 * Trigger lifecycle hooks for a specific event
 *
 * @param {string} event - Lifecycle event name
 * @param {object} context - Application context
 * @returns {Promise<void>}
 * @private
 */
async function triggerLifecycleHooks(event, context) {
  const hooks = lifecycleHooks[event] || [];

  for (const hook of hooks) {
    await Promise.resolve(hook(context));
  }
}

/**
 * Initialize a single module and its dependencies
 *
 * @param {string} name - Module name
 * @param {object} context - Application context
 * @returns {Promise<void>}
 * @private
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
      if (!modules[dep]) {
        throw new Error(`Dependency "${dep}" required by "${name}" is not registered`);
      }

      await initializeModule(dep, context);
    }
  }

  // Initialize the module
  try {
    // Trigger beforeInit hooks
    await triggerLifecycleHooks('beforeInit', { ...context, moduleName: name });

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

    // Trigger afterInit hooks
    await triggerLifecycleHooks('afterInit', { ...context, moduleName: name });
  } catch (error) {
    error.module = name;
    throw error;
  }
}

/**
 * Initialize all registered modules
 *
 * @param {object} app - Express or compatible app instance
 * @param {object} config - Application configuration
 * @returns {Promise<object>} The application context
 */
export async function initializeModules(app, config = {}) {
  // Clear initialized set if it has values (for tests/reuse)
  if (initialized.size > 0) {
    initialized.clear();
  }

  // Create context object
  const context = {
    app,
    services: {},
    config,
    state: {},
    getService: (moduleName, serviceName) => {
      const moduleServices = context.services[moduleName];
      if (!moduleServices) {
        return undefined;
      }

      return serviceName ? moduleServices[serviceName] : moduleServices;
    },
    setState: (key, value) => {
      context.state[key] = value;
    },
    getState: (key, defaultValue) => {
      return context.state[key] !== undefined ? context.state[key] : defaultValue;
    }
  };

  // Trigger beforeAllInit hooks
  await triggerLifecycleHooks('beforeAllInit', context);

  // Initialize each module
  for (const name of Object.keys(modules)) {
    try {
      await initializeModule(name, context);
    } catch (error) {
      console.error(`Failed to initialize module ${error.module || name}:`, error);
      throw error;
    }
  }

  // Trigger afterAllInit hooks
  await triggerLifecycleHooks('afterAllInit', context);

  return context;
}

/**
 * Gracefully shutdown all modules
 *
 * @param {object} context - Application context
 * @returns {Promise<void>}
 */
export async function shutdownModules(context) {
  // Trigger beforeShutdown hooks
  await triggerLifecycleHooks('beforeShutdown', context);

  // Shutdown modules in reverse initialization order
  const moduleNames = Array.from(initialized);

  for (let i = moduleNames.length - 1; i >= 0; i--) {
    const name = moduleNames[i];
    const module = modules[name];

    if (typeof module.shutdown === 'function') {
      try {
        await Promise.resolve(module.shutdown(context));
        console.log(`Shutdown module: ${name}`);
      } catch (error) {
        console.error(`Error shutting down module ${name}:`, error);
      }
    }
  }

  // Clear initialized modules
  initialized.clear();

  // Trigger afterShutdown hooks
  await triggerLifecycleHooks('afterShutdown', context);
}
