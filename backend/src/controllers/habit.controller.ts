import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { CreateHabitUseCase } from '../usecases/habits/create-habit.usecase.js';
import { ListHabitsUseCase } from '../usecases/habits/list-habits.usecase.js';
import { GetHabitUseCase } from '../usecases/habits/get-habit.usecase.js';
import { UpdateHabitUseCase } from '../usecases/habits/update-habit.usecase.js';
import { DeleteHabitUseCase } from '../usecases/habits/delete-habit.usecase.js';
import { ArchiveHabitUseCase } from '../usecases/habits/archive-habit.usecase.js';
import { validateBody } from '../middleware/validation.middleware.js';

const createHabitSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().nullable().optional(),
  categoryId: z.string(),
  frequencyType: z.enum(['DAILY', 'WEEKLY_DAYS', 'TIMES_PER_PERIOD']).default('DAILY'),
  frequencyPayload: z.array(z.number()).nullable().optional(),
  targetType: z.enum(['BOOLEAN', 'NUMERIC']).default('BOOLEAN'),
  targetValue: z.number().nullable().optional(),
  unit: z.string().nullable().optional(),
  reminderTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).nullable().optional(),
  color: z.string().default('#3B82F6'),
  icon: z.string().default('check-circle'),
});

const updateHabitSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().nullable().optional(),
  categoryId: z.string().optional(),
  reminderTime: z.string().nullable().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
});

const archiveSchema = z.object({
  isArchived: z.boolean(),
});

export function createHabitRouter(
  createHabitUseCase: CreateHabitUseCase,
  listHabitsUseCase: ListHabitsUseCase,
  getHabitUseCase: GetHabitUseCase,
  updateHabitUseCase: UpdateHabitUseCase,
  deleteHabitUseCase: DeleteHabitUseCase,
  archiveHabitUseCase: ArchiveHabitUseCase,
  authMiddleware: any
): Router {
  const router = Router();
  router.use(authMiddleware);

  router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const isArchived =
        req.query.isArchived !== undefined
          ? req.query.isArchived === 'true'
          : undefined;
      const categoryId = req.query.categoryId as string | undefined;
      const sort = req.query.sort as 'createdAt' | 'title' | 'streak' | undefined;
      const order = req.query.order as 'asc' | 'desc' | undefined;

      const habits = await listHabitsUseCase.execute(req.user!.id, {
        isArchived,
        categoryId,
        sort,
        order,
      });

      res.status(200).json({
        success: true,
        data: habits,
      });
    } catch (err) {
      next(err);
    }
  });

  router.post(
    '/',
    validateBody(createHabitSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const habit = await createHabitUseCase.execute({
          ...req.body,
          userId: req.user!.id,
        });
        res.status(201).json({
          success: true,
          data: habit,
        });
      } catch (err) {
        next(err);
      }
    }
  );

  router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const habit = await getHabitUseCase.execute(String(req.params.id), req.user!.id);
      res.status(200).json({
        success: true,
        data: habit,
      });
    } catch (err) {
      next(err);
    }
  });

  router.put(
    '/:id',
    validateBody(updateHabitSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const habit = await updateHabitUseCase.execute({
          ...req.body,
          habitId: String(req.params.id),
          userId: req.user!.id,
        });
        res.status(200).json({
          success: true,
          data: habit,
        });
      } catch (err) {
        next(err);
      }
    }
  );

  router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await deleteHabitUseCase.execute(String(req.params.id), req.user!.id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  });

  router.patch(
    '/:id/archive',
    validateBody(archiveSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const habit = await archiveHabitUseCase.execute(
          String(req.params.id),
          req.user!.id,
          req.body.isArchived
        );
        res.status(200).json({
          success: true,
          data: habit,
        });
      } catch (err) {
        next(err);
      }
    }
  );

  return router;
}
