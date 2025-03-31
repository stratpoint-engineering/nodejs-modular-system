/**
 * Authentication Module
 *
 * Provides authentication and authorization capabilities for the application.
 */

import { createHandler } from '../../core/adapters/framework.js';
import { generateId } from '../../core/utils/index.js';

// In-memory user store (replace with database in production)
const users = new Map();
const sessions = new Map();

// Authentication module definition
const authModule = {
  id: 'auth',
  name: 'Authentication Module',

  // Dependencies
  dependencies: ['logger'],

  // Initialize function
  async initialize(context) {
    const logger = context.getService('logger');
    logger.info('Authentication module initialized');

    // Add a default admin user if none exists
    if (users.size === 0) {
      const adminId = generateId();
      users.set(adminId, {
        id: adminId,
        username: 'admin',
        password: 'admin123', // In production, use hashed passwords
        roles: ['admin'],
        createdAt: new Date()
      });

      logger.info('Default admin user created');
    }
  },

  // Define routes
  routes(app) {
    // Login route
    app.post('/api/auth/login', createHandler(async (req) => {
      const { username, password } = req.body;

      // Find user by username
      const user = Array.from(users.values()).find(u => u.username === username);

      if (!user || user.password !== password) {
        const error = new Error('Invalid username or password');
        error.statusCode = 401;
        throw error;
      }

      // Create session
      const sessionId = generateId(32);
      const session = {
        id: sessionId,
        userId: user.id,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      };

      sessions.set(sessionId, session);

      // Return user info and token
      return {
        user: {
          id: user.id,
          username: user.username,
          roles: user.roles
        },
        token: sessionId,
        expiresAt: session.expiresAt
      };
    }));

    // Logout route
    app.post('/api/auth/logout', createHandler(async (req) => {
      const token = req.headers.authorization?.split(' ')[1];

      if (token && sessions.has(token)) {
        sessions.delete(token);
      }

      return { success: true };
    }));

    // Get current user route
    app.get('/api/auth/me', createHandler(async (req) => {
      const token = req.headers.authorization?.split(' ')[1];

      if (!token || !sessions.has(token)) {
        const error = new Error('Unauthorized');
        error.statusCode = 401;
        throw error;
      }

      const session = sessions.get(token);

      // Check if session is expired
      if (session.expiresAt < new Date()) {
        sessions.delete(token);
        const error = new Error('Session expired');
        error.statusCode = 401;
        throw error;
      }

      const user = users.get(session.userId);

      if (!user) {
        sessions.delete(token);
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
      }

      return {
        id: user.id,
        username: user.username,
        roles: user.roles
      };
    }));

    // Register route
    app.post('/api/auth/register', createHandler(async (req) => {
      const { username, password } = req.body;

      // Check if username already exists
      if (Array.from(users.values()).some(u => u.username === username)) {
        const error = new Error('Username already exists');
        error.statusCode = 409;
        throw error;
      }

      // Create new user
      const userId = generateId();
      const user = {
        id: userId,
        username,
        password, // In production, use hashed passwords
        roles: ['user'],
        createdAt: new Date()
      };

      users.set(userId, user);

      return {
        id: user.id,
        username: user.username,
        roles: user.roles
      };
    }));
  },

  // Exposed services
  services: {
    /**
     * Authenticate a user by token
     *
     * @param {string} token - Authentication token
     * @returns {object|null} User object or null if not authenticated
     */
    authenticate(token) {
      if (!token || !sessions.has(token)) {
        return null;
      }

      const session = sessions.get(token);

      // Check if session is expired
      if (session.expiresAt < new Date()) {
        sessions.delete(token);
        return null;
      }

      const user = users.get(session.userId);

      if (!user) {
        sessions.delete(token);
        return null;
      }

      return {
        id: user.id,
        username: user.username,
        roles: user.roles
      };
    },

    /**
     * Check if a user has a specific role
     *
     * @param {string} token - Authentication token
     * @param {string} role - Role to check
     * @returns {boolean} True if user has the role
     */
    hasRole(token, role) {
      const user = this.authenticate(token);

      if (!user) {
        return false;
      }

      return user.roles.includes(role);
    },

    /**
     * Create authentication middleware
     *
     * @returns {Function} Express middleware
     */
    requireAuth() {
      return (req, res, next) => {
        const token = req.headers.authorization?.split(' ')[1];
        const user = this.authenticate(token);

        if (!user) {
          res.status(401).json({ error: 'Unauthorized' });
          return;
        }

        req.user = user;
        next();
      };
    },

    /**
     * Create role-based authorization middleware
     *
     * @param {string|string[]} roles - Required roles
     * @returns {Function} Express middleware
     */
    requireRole(roles) {
      const requiredRoles = Array.isArray(roles) ? roles : [roles];

      return (req, res, next) => {
        const token = req.headers.authorization?.split(' ')[1];
        const user = this.authenticate(token);

        if (!user) {
          res.status(401).json({ error: 'Unauthorized' });
          return;
        }

        const hasRequiredRole = requiredRoles.some(role => user.roles.includes(role));

        if (!hasRequiredRole) {
          res.status(403).json({ error: 'Forbidden' });
          return;
        }

        req.user = user;
        next();
      };
    }
  }
};

export default authModule;
