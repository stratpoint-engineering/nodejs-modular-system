/**
 * Products module implementation
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

// Products module definition
const productsModule: ModuleDefinition = {
  id: 'products',
  name: 'Products Module',

  // Dependencies
  dependencies: ['logger'],

  // Initialize function
  initialize(context) {
    const logger = context.getService('logger');
    logger.info('Products module initialized');
  },

  // Define routes
  routes(app) {
    app.get('/api/products', (req: any, res: any) => {
      return { message: 'Hello from Products module!' };
    });
  },

  // Exposed services
  services: {
    doSomething(data: string): string {
      return `Processed by Products: ${data}`;
    }
  }
};

export default productsModule;
