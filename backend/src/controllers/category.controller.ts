import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { GetCategoriesUseCase } from '../usecases/categories/get-categories.usecase.js';
import { CreateCategoryUseCase } from '../usecases/categories/create-category.usecase.js';
import { validateBody } from '../middleware/validation.middleware.js';

const createCategorySchema = z.object({
  name: z.string().min(2).max(50),
  icon: z.string().min(1),
  color: z.string().min(1),
});

export function createCategoryRouter(
  getCategoriesUseCase: GetCategoriesUseCase,
  createCategoryUseCase: CreateCategoryUseCase,
  authMiddleware: any
): Router {
  const router = Router();
  router.use(authMiddleware);

  router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const categories = await getCategoriesUseCase.execute();
      res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (err) {
      next(err);
    }
  });

  router.post(
    '/',
    validateBody(createCategorySchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const category = await createCategoryUseCase.execute(req.body);
        res.status(201).json({
          success: true,
          data: category,
        });
      } catch (err) {
        next(err);
      }
    }
  );

  return router;
}
