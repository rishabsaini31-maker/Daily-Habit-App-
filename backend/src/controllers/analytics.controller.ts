import { Router, Request, Response, NextFunction } from 'express';
import { GetAnalyticsSummaryUseCase } from '../usecases/analytics/get-analytics-summary.usecase.js';
import { GetHeatmapUseCase } from '../usecases/analytics/get-heatmap.usecase.js';

export function createAnalyticsRouter(
  getAnalyticsSummaryUseCase: GetAnalyticsSummaryUseCase,
  getHeatmapUseCase: GetHeatmapUseCase,
  authMiddleware: any
): Router {
  const router = Router();
  router.use(authMiddleware);

  router.get('/summary', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const summary = await getAnalyticsSummaryUseCase.execute(req.user!.id);
      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (err) {
      next(err);
    }
  });

  router.get('/heatmap', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const month = req.query.month as string | undefined;
      const heatmap = await getHeatmapUseCase.execute(req.user!.id, month);
      res.status(200).json({
        success: true,
        data: heatmap,
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
