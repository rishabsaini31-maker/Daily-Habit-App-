import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { GetAdminDashboardUseCase } from '../usecases/admin/get-admin-dashboard.usecase.js';
import { ListAdminUsersUseCase } from '../usecases/admin/list-admin-users.usecase.js';
import { UpdateUserStatusUseCase } from '../usecases/admin/update-user-status.usecase.js';
import { CreateTemplateUseCase } from '../usecases/admin/create-template.usecase.js';
import { UpdateTemplateUseCase } from '../usecases/admin/update-template.usecase.js';
import { DeleteTemplateUseCase } from '../usecases/admin/delete-template.usecase.js';
import { ListAuditLogsUseCase } from '../usecases/admin/list-audit-logs.usecase.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import { validateBody } from '../middleware/validation.middleware.js';

const updateUserStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED']),
  reason: z.string().min(5).max(500),
});

const createOrUpdateTemplateSchema = z.object({
  title: z.string().min(2).max(100),
  description: z.string().min(5),
  categoryId: z.string(),
  frequencyType: z.enum(['DAILY', 'WEEKLY_DAYS', 'TIMES_PER_PERIOD']).default('DAILY'),
  frequencyPayload: z.array(z.number()).nullable().optional(),
  targetType: z.enum(['BOOLEAN', 'NUMERIC']).default('BOOLEAN'),
  targetValue: z.number().nullable().optional(),
  unit: z.string().nullable().optional(),
  icon: z.string().default('star'),
  color: z.string().default('#3B82F6'),
  isPublished: z.boolean().default(true),
});

export function createAdminRouter(
  getAdminDashboardUseCase: GetAdminDashboardUseCase,
  listAdminUsersUseCase: ListAdminUsersUseCase,
  updateUserStatusUseCase: UpdateUserStatusUseCase,
  createTemplateUseCase: CreateTemplateUseCase,
  updateTemplateUseCase: UpdateTemplateUseCase,
  deleteTemplateUseCase: DeleteTemplateUseCase,
  listAuditLogsUseCase: ListAuditLogsUseCase,
  authMiddleware: any
): Router {
  const router = Router();
  router.use(authMiddleware);
  router.use(requireRole('ADMIN'));

  // GET /admin/dashboard
  router.get('/dashboard', async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const metrics = await getAdminDashboardUseCase.execute();
      res.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (err) {
      next(err);
    }
  });

  // GET /admin/users
  router.get('/users', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string, 10) || 20));
      const search = req.query.search as string | undefined;
      const status = req.query.status as string | undefined;

      const result = await listAdminUsersUseCase.execute({
        page,
        limit,
        search,
        status,
      });

      res.status(200).json({
        success: true,
        data: result.users,
        meta: result.meta,
      });
    } catch (err) {
      next(err);
    }
  });

  // PATCH /admin/users/:id/status
  router.patch(
    '/users/:id/status',
    validateBody(updateUserStatusSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = await updateUserStatusUseCase.execute({
          targetUserId: String(req.params.id),
          adminId: req.user!.id,
          adminEmail: req.user!.email,
          status: req.body.status,
          reason: req.body.reason,
          ipAddress: req.ip || null,
        });

        res.status(200).json({
          success: true,
          data: user,
        });
      } catch (err) {
        next(err);
      }
    }
  );

  // POST /admin/templates
  router.post(
    '/templates',
    validateBody(createOrUpdateTemplateSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const template = await createTemplateUseCase.execute({
          ...req.body,
          adminId: req.user!.id,
          adminEmail: req.user!.email,
          ipAddress: req.ip || null,
        });

        res.status(201).json({
          success: true,
          data: template,
        });
      } catch (err) {
        next(err);
      }
    }
  );

  // PUT /admin/templates/:id
  router.put(
    '/templates/:id',
    validateBody(createOrUpdateTemplateSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const template = await updateTemplateUseCase.execute({
          ...req.body,
          templateId: String(req.params.id),
          adminId: req.user!.id,
          adminEmail: req.user!.email,
          ipAddress: req.ip || null,
        });

        res.status(200).json({
          success: true,
          data: template,
        });
      } catch (err) {
        next(err);
      }
    }
  );

  // DELETE /admin/templates/:id
  router.delete('/templates/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await deleteTemplateUseCase.execute(
        String(req.params.id),
        req.user!.id,
        req.user!.email,
        req.ip || null
      );

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  });

  // GET /admin/audit-logs
  router.get('/audit-logs', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string, 10) || 20));
      const actorId = req.query.actorId as string | undefined;
      const action = req.query.action as string | undefined;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;

      const result = await listAuditLogsUseCase.execute({
        page,
        limit,
        actorId,
        action,
        startDate,
        endDate,
      });

      res.status(200).json({
        success: true,
        data: result.logs,
        meta: result.meta,
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
