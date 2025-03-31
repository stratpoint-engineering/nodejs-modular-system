/**
 * Application configuration
 */

export default {
  database: {
    url: process.env.DATABASE_URL || 'mongodb://localhost:27017/modular-app',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d'
  },
  logger: {
    level: process.env.LOG_LEVEL || 'info'
  }
};
