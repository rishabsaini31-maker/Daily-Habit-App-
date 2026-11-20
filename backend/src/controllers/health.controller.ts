import { Router, Request, Response } from 'express';

export function createHealthRouter(): Router {
  const router = Router();

  router.get('/', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      service: 'habitpulse-backend',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}
