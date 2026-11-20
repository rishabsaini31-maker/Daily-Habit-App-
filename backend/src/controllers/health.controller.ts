import { Router, Request, Response } from 'express';
import { PgConnection } from '../infrastructure/database/pg-connection.js';

export function createHealthRouter(): Router {
  const router = Router();

  router.get('/', async (_req: Request, res: Response) => {
    const isPostgres =
      process.env.DATABASE_URL?.startsWith('postgres://') ||
      process.env.DATABASE_URL?.startsWith('postgresql://');

    let dbConnected = true;
    if (isPostgres) {
      dbConnected = await PgConnection.testConnection().catch(() => false);
    }

    res.status(200).json({
      status: 'ok',
      service: 'habitpulse-backend',
      version: '1.0.0',
      database: {
        driver: isPostgres ? 'postgresql' : 'sqlite',
        connected: dbConnected,
        supabase_project: 'extmmwjtdmrwmminyekq',
        pooler_host: 'aws-1-ap-southeast-1.pooler.supabase.com:5432',
      },
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}
