import { Router, Request, Response, NextFunction } from 'express';
import { ListTemplatesUseCase } from '../usecases/templates/list-templates.usecase.js';
import { AdoptTemplateUseCase } from '../usecases/templates/adopt-template.usecase.js';

export function createTemplateRouter(
  listTemplatesUseCase: ListTemplatesUseCase,
  adoptTemplateUseCase: AdoptTemplateUseCase,
  authMiddleware: any
): Router {
  const router = Router();
  router.use(authMiddleware);

  router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const categoryId = req.query.categoryId as string | undefined;
      const search = req.query.search as string | undefined;

      const templates = await listTemplatesUseCase.execute({
        categoryId,
        search,
      });

      res.status(200).json({
        success: true,
        data: templates,
      });
    } catch (err) {
      next(err);
    }
  });

  router.post('/:id/adopt', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const habit = await adoptTemplateUseCase.execute(String(req.params.id), req.user!.id);
      res.status(201).json({
        success: true,
        data: habit,
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
