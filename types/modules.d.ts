/**
 * Type definitions for the enhanced module system
 */

/**
 * Module definition interface
 */
export interface ModuleDefinition {
  /**
   * Unique identifier for the module
   */
  id: string;

  /**
   * Human-readable name for the module
   */
  name: string;

  /**
   * Array of other module names this module depends on
   */
  dependencies?: string[];

  /**
   * Module initialization function, called during system startup
   */
  initialize?: (context: ApplicationContext) => void | Promise<void>;

  /**
   * Module shutdown function, called during system shutdown
   */
  shutdown?: (context: ApplicationContext) => void | Promise<void>;

  /**
   * Function to register module routes with the app
   */
  routes?: (app: any) => void;

  /**
   * Services exposed by this module for other modules to consume
   */
  services?: Record<string, any>;
}

/**
 * Application context provided to modules
 */
export interface ApplicationContext {
  /**
   * The web framework instance (Express, Fastify, etc.)
   */
  app: any;

  /**
   * Services exposed by all modules
   */
  services: Record<string, any>;

  /**
   * Application configuration
   */
  config: Record<string, any>;

  /**
   * Application state storage
   */
  state: Record<string, any>;

  /**
   * Get a service from another module
   *
   * @param moduleName The name of the module
   * @param serviceName Optional service name to retrieve a specific service
   */
  getService: (moduleName: string, serviceName?: string) => any;

  /**
   * Set a value in the application state
   *
   * @param key The state key (can use dot notation for nested properties)
   * @param value The value to set
   */
  setState: (key: string, value: any) => void;

  /**
   * Get a value from the application state
   *
   * @param key The state key (can use dot notation for nested properties)
   * @param defaultValue Default value if the key doesn't exist
   */
  getState: <T>(key: string, defaultValue?: T) => T;
}

/**
 * Lifecycle hook event names
 */
export type LifecycleEvent =
  | 'beforeAllInit'
  | 'beforeInit'
  | 'afterInit'
  | 'afterAllInit'
  | 'beforeShutdown'
  | 'afterShutdown';

/**
 * Register a module with the system
 */
export function registerModule(name: string, module: ModuleDefinition): ModuleDefinition;

/**
 * Get a registered module by name
 */
export function getModule(name: string): ModuleDefinition | undefined;

/**
 * Get all registered modules
 */
export function getAllModules(): Record<string, ModuleDefinition>;

/**
 * Register a lifecycle hook for a specific event
 */
export function registerLifecycleHook(
  event: LifecycleEvent,
  callback: (context: ApplicationContext) => void | Promise<void>
): void;

/**
 * Initialize all registered modules
 */
export function initializeModules(app: any, config?: Record<string, any>): Promise<ApplicationContext>;

/**
 * Gracefully shutdown all modules
 */
export function shutdownModules(context: ApplicationContext): Promise<void>;
