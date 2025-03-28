/**
 * Logger module implementation
 */

// Define the module type
interface LoggerModule {
  id: string;
  name: string;
  dependencies?: string[];
  initialize?: (context: any) => void | Promise<void>;
  routes?: (app: any) => void;
  services?: Record<string, any>;
}

// Define log levels
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Logger service implementation
const loggerService = {
  debug(message: string, ...args: any[]): void {
    if (process.env.DEBUG) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  },

  info(message: string, ...args: any[]): void {
    console.log(`[INFO] ${message}`, ...args);
  },

  warn(message: string, ...args: any[]): void {
    console.warn(`[WARN] ${message}`, ...args);
  },

  error(message: string, error?: any, ...args: any[]): void {
    console.error(`[ERROR] ${message}`, error || '', ...args);
  },

  log(level: LogLevel, message: string, ...args: any[]): void {
    switch (level) {
      case 'debug':
        this.debug(message, ...args);
        break;
      case 'info':
        this.info(message, ...args);
        break;
      case 'warn':
        this.warn(message, ...args);
        break;
      case 'error':
        this.error(message, ...args);
        break;
    }
  }
};

// Logger module definition
const loggerModule: LoggerModule = {
  id: 'logger',
  name: 'Logger Module',

  // No dependencies
  dependencies: [],

  // Initialize function
  initialize(context) {
    console.log('Logger module initialized');
  },

  // Exposed services
  services: loggerService
};

export default loggerModule;
