import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { LogCompletionUseCase } from '../usecases/completions/log-completion.usecase.js';
import { DeleteCompletionUseCase } from '../usecases/completions/delete-completion.usecase.js';
import { GetCompletionsUseCase } from '../usecases/completions/get-completions.usecase.js';
import { validateBody } from '../middleware/validation.middleware.js';

const logCompletionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(['COMPLETED', 'SKIPPED']).default('COMPLETED'),
  value: z.number().default(1),
  notes: z.string().nullable().optional(),
});

export function createCompletionRouter(
  logCompletionUseCase: LogCompletionUseCase,
  deleteCompletionUseCase: DeleteCompletionUseCase,
  getCompletionsUseCase: GetCompletionsUseCase,
  authMiddleware: any
): Router {
  const router = Router({ mergeParams: true });
  router.use(authMiddleware);

  router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const habitId = String(req.params.id);
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;

      const completions = await getCompletionsUseCase.execute(habitId, req.user!.id, {
        startDate,
        endDate,
      });

      res.status(200).json({
        success: true,
        data: completions,
      });
    } catch (err) {
      next(err);
    }
  });

  router.post(
    '/',
    validateBody(logCompletionSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const habitId = String(req.params.id);
        const result = await logCompletionUseCase.execute({
          ...req.body,
          habitId,
          userId: req.user!.id,
        });

        res.status(200).json({
          success: true,
          data: result,
        });
      } catch (err) {
        next(err);
      }
    }
  );

  router.delete('/:date', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const habitId = String(req.params.id);
      const date = String(req.params.date);

      const result = await deleteCompletionUseCase.execute(habitId, date, req.user!.id);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
