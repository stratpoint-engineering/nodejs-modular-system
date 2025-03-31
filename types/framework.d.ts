/**
 * Type definitions for the framework adapter
 */

/**
 * Framework options
 */
export interface FrameworkOptions {
  /**
   * Framework to use ('express' or 'fastify')
   */
  framework?: string;

  /**
   * Enable CORS middleware
   */
  cors?: boolean | object;

  /**
   * Enable compression middleware
   */
  compression?: boolean;

  /**
   * Enable helmet security middleware
   */
  helmet?: boolean | object;

  /**
   * Enable logging (for Fastify)
   */
  logger?: boolean | object;

  /**
   * Fastify-specific options
   */
  fastify?: object;

  /**
   * Express-specific options
   */
  express?: object;
}

/**
 * Create an application instance with the configured framework
 */
export function createApp(options?: FrameworkOptions): Promise<any>;

/**
 * Create a standard route handler with error handling
 */
export function createHandler(fn: (req: any, res: any) => any): (req: any, res: any, next: any) => Promise<void>;
