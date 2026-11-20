import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Database as DatabaseType } from 'better-sqlite3';
import { DatabaseConnection } from './infrastructure/database/connection.js';
import { createApiRouter } from './controllers/routes.js';
import { errorHandler } from './middleware/error.middleware.js';
import { apiRateLimiter } from './middleware/rate-limit.middleware.js';

export function createApp(dbInstance?: DatabaseType): Express {
  const app = express();
  const db = dbInstance || DatabaseConnection.getInstance();

  // Security Headers & CORS
  app.use(helmet());
  app.use(cors({ origin: '*', credentials: true }));

  // JSON Body Parser
  app.use(express.json());

  // General API Rate Limiter
  app.use(apiRateLimiter);

  // Health checks
  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'habitpulse-backend',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  const apiRouter = createApiRouter(db);

  // Mount at both /api/v1 (standard REST prefix) and root for convenience
  app.use('/api/v1', apiRouter);
  app.use('/', apiRouter);

  // Centralized Error Handling Middleware
  app.use(errorHandler);

  return app;
}
