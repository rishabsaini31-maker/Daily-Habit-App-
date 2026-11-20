import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { GetStreakUseCase } from '../usecases/streaks/get-streak.usecase.js';
import { FreezeStreakUseCase } from '../usecases/streaks/freeze-streak.usecase.js';
import { validateBody } from '../middleware/validation.middleware.js';

const freezeSchema = z.object({
  missedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export function createStreakRouter(
  getStreakUseCase: GetStreakUseCase,
  freezeStreakUseCase: FreezeStreakUseCase,
  authMiddleware: any
): Router {
  const router = Router({ mergeParams: true });
  router.use(authMiddleware);

  router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const habitId = String(req.params.id);
      const streak = await getStreakUseCase.execute(habitId, req.user!.id);
      res.status(200).json({
        success: true,
        data: streak,
      });
    } catch (err) {
      next(err);
    }
  });

  router.post(
    '/freeze',
    validateBody(freezeSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const habitId = String(req.params.id);
        const streak = await freezeStreakUseCase.execute({
          habitId,
          userId: req.user!.id,
          missedDate: req.body.missedDate,
        });

        res.status(200).json({
          success: true,
          data: streak,
        });
      } catch (err) {
        next(err);
      }
    }
  );

  return router;
}
