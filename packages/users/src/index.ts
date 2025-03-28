/**
 * Users module implementation
 */

import { Request, Response } from 'express';

// Define the module type
interface ModuleDefinition {
  id: string;
  name: string;
  dependencies?: string[];
  initialize?: (context: any) => void | Promise<void>;
  routes?: (app: any) => void;
  services?: Record<string, any>;
}

// User type definition
interface User {
  id: number;
  name: string;
  email: string;
}

// In-memory user storage for demo purposes
const users: User[] = [
  { id: 1, name: 'John Doe', email: 'john@example.com' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
];

// User service implementation
const userService = {
  findById(id: number): User | undefined {
    return users.find(u => u.id === id);
  },

  getAll(): User[] {
    return [...users];
  },

  create(userData: Omit<User, 'id'>): User {
    const id = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
    const newUser = { id, ...userData };
    users.push(newUser);
    return newUser;
  },

  update(id: number, userData: Partial<Omit<User, 'id'>>): User | undefined {
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return undefined;

    users[index] = { ...users[index], ...userData };
    return users[index];
  },

  delete(id: number): boolean {
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return false;

    users.splice(index, 1);
    return true;
  }
};

// Users module definition
const usersModule: ModuleDefinition = {
  id: 'users',
  name: 'Users Module',

  // Dependencies
  dependencies: ['logger'],

  // Initialize function
  initialize(context) {
    const logger = context.getService('logger');
    logger.info('Users module initialized');
  },

  // Define routes
  routes(app) {
    // Get all users
    app.get('/api/users', async (req: Request, res: Response) => {
      return { users: userService.getAll() };
    });

    // Get user by ID
    app.get('/api/users/:id', async (req: Request, res: Response) => {
      const id = parseInt(req.params.id);
      const user = userService.findById(id);

      if (!user) {
        res.status(404);
        return { error: 'User not found' };
      }

      return { user };
    });

    // Create user
    app.post('/api/users', async (req: Request, res: Response) => {
      const { name, email } = req.body;

      if (!name || !email) {
        res.status(400);
        return { error: 'Name and email are required' };
      }

      const newUser = userService.create({ name, email });

      res.status(201);
      return { user: newUser };
    });

    // Update user
    app.put('/api/users/:id', async (req: Request, res: Response) => {
      const id = parseInt(req.params.id);
      const { name, email } = req.body;

      const updatedUser = userService.update(id, { name, email });

      if (!updatedUser) {
        res.status(404);
        return { error: 'User not found' };
      }

      return { user: updatedUser };
    });

    // Delete user
    app.delete('/api/users/:id', async (req: Request, res: Response) => {
      const id = parseInt(req.params.id);
      const success = userService.delete(id);

      if (!success) {
        res.status(404);
        return { error: 'User not found' };
      }

      return { success: true };
    });
  },

  // Exposed services
  services: userService
};

export default usersModule;
