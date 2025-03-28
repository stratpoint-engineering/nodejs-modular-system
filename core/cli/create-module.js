#!/usr/bin/env node

/**
 * CLI tool for creating new modules
 *
 * Usage: node core/cli/create-module.js my-module
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get module name from command line
const moduleName = process.argv[2];

if (!moduleName) {
  console.error('Please provide a module name');
  console.error('Usage: node core/cli/create-module.js my-module');
  process.exit(1);
}

// Convert module name to kebab-case for directory and camelCase for variables
const kebabCase = moduleName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
const camelCase = kebabCase.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
const pascalCase = camelCase.charAt(0).toUpperCase() + camelCase.slice(1);

// Create module directory
const moduleDir = path.join(__dirname, '../../packages', kebabCase);
const srcDir = path.join(moduleDir, 'src');

if (fs.existsSync(moduleDir)) {
  console.error(`Module directory already exists: ${moduleDir}`);
  process.exit(1);
}

fs.mkdirSync(srcDir, { recursive: true });

// Create package.json
const packageJson = {
  name: `@nodejs-modular-system/${kebabCase}`,
  version: "1.0.0",
  description: `${pascalCase} module for the modular system`,
  main: "dist/index.js",
  types: "dist/index.d.ts",
  type: "module",
  scripts: {
    build: "tsc",
    test: "jest"
  },
  keywords: [
    kebabCase,
    "module"
  ],
  author: "",
  license: "MIT",
  devDependencies: {
    "@types/node": "^18.15.11",
    "typescript": "^5.0.4"
  }
};

fs.writeFileSync(
  path.join(moduleDir, 'package.json'),
  JSON.stringify(packageJson, null, 2)
);

// Create tsconfig.json
const tsConfig = {
  compilerOptions: {
    target: "ES2020",
    module: "NodeNext",
    moduleResolution: "NodeNext",
    esModuleInterop: true,
    strict: true,
    skipLibCheck: true,
    declaration: true,
    outDir: "dist",
    sourceMap: true
  },
  include: ["src/**/*"],
  exclude: ["node_modules", "dist"]
};

fs.writeFileSync(
  path.join(moduleDir, 'tsconfig.json'),
  JSON.stringify(tsConfig, null, 2)
);

// Create module file
const moduleContent = `/**
 * ${pascalCase} module implementation
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

// ${pascalCase} module definition
const ${camelCase}Module: ModuleDefinition = {
  id: '${kebabCase}',
  name: '${pascalCase} Module',

  // Dependencies
  dependencies: ['logger'],

  // Initialize function
  initialize(context) {
    const logger = context.getService('logger');
    logger.info('${pascalCase} module initialized');
  },

  // Define routes
  routes(app) {
    app.get('/api/${kebabCase}', (req, res) => {
      return { message: 'Hello from ${pascalCase} module!' };
    });
  },

  // Exposed services
  services: {
    doSomething(data: string): string {
      return \`Processed by ${pascalCase}: \${data}\`;
    }
  }
};

export default ${camelCase}Module;
`;

fs.writeFileSync(path.join(srcDir, 'index.ts'), moduleContent);

console.log(`Module created successfully: ${kebabCase}`);
console.log(`Directory: ${moduleDir}`);
console.log('\nTo use this module:');
console.log('\n1. Build the module:');
console.log(`npm run build`);
console.log('\n2. Add the following to app.js:');
console.log(`
import ${camelCase}Module from './packages/${kebabCase}/dist/index.js';
registerModule('${kebabCase}', ${camelCase}Module);
`);
