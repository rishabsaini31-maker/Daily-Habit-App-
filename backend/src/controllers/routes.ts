import { Router } from 'express';
import { Database as DatabaseType } from 'better-sqlite3';

// Repositories
import { SqliteUserRepository } from '../infrastructure/database/repositories/sqlite-user.repository.js';
import { PgUserRepository } from '../infrastructure/database/repositories/pg-user.repository.js';
import { SqliteCategoryRepository } from '../infrastructure/database/repositories/sqlite-category.repository.js';
import { SqliteHabitRepository } from '../infrastructure/database/repositories/sqlite-habit.repository.js';
import { SqliteCompletionRepository } from '../infrastructure/database/repositories/sqlite-completion.repository.js';
import { SqliteStreakRepository } from '../infrastructure/database/repositories/sqlite-streak.repository.js';
import { SqliteTemplateRepository } from '../infrastructure/database/repositories/sqlite-template.repository.js';
import { SqliteAuditLogRepository } from '../infrastructure/database/repositories/sqlite-audit-log.repository.js';
import { SqliteFocusRepository } from '../infrastructure/database/repositories/sqlite-focus.repository.js';
import { PgFocusRepository } from '../infrastructure/database/repositories/pg-focus.repository.js';

// Services
import { JwtTokenService } from '../infrastructure/security/jwt-token.service.js';
import { BcryptPasswordHasher } from '../infrastructure/security/bcrypt-hasher.service.js';
import { SystemClockService } from '../infrastructure/clock/system-clock.service.js';

// Middlewares
import { createAuthMiddleware } from '../middleware/auth.middleware.js';

// Use Cases
import { RegisterUseCase } from '../usecases/auth/register.usecase.js';
import { LoginUseCase } from '../usecases/auth/login.usecase.js';
import { GetMeUseCase } from '../usecases/auth/get-me.usecase.js';
import { GetCategoriesUseCase } from '../usecases/categories/get-categories.usecase.js';
import { CreateCategoryUseCase } from '../usecases/categories/create-category.usecase.js';
import { CreateHabitUseCase } from '../usecases/habits/create-habit.usecase.js';
import { ListHabitsUseCase } from '../usecases/habits/list-habits.usecase.js';
import { GetHabitUseCase } from '../usecases/habits/get-habit.usecase.js';
import { UpdateHabitUseCase } from '../usecases/habits/update-habit.usecase.js';
import { DeleteHabitUseCase } from '../usecases/habits/delete-habit.usecase.js';
import { ArchiveHabitUseCase } from '../usecases/habits/archive-habit.usecase.js';
import { LogCompletionUseCase } from '../usecases/completions/log-completion.usecase.js';
import { DeleteCompletionUseCase } from '../usecases/completions/delete-completion.usecase.js';
import { GetCompletionsUseCase } from '../usecases/completions/get-completions.usecase.js';
import { GetStreakUseCase } from '../usecases/streaks/get-streak.usecase.js';
import { FreezeStreakUseCase } from '../usecases/streaks/freeze-streak.usecase.js';
import { GetAnalyticsSummaryUseCase } from '../usecases/analytics/get-analytics-summary.usecase.js';
import { GetHeatmapUseCase } from '../usecases/analytics/get-heatmap.usecase.js';
import { ListTemplatesUseCase } from '../usecases/templates/list-templates.usecase.js';
import { AdoptTemplateUseCase } from '../usecases/templates/adopt-template.usecase.js';
import { GetAdminDashboardUseCase } from '../usecases/admin/get-admin-dashboard.usecase.js';
import { ListAdminUsersUseCase } from '../usecases/admin/list-admin-users.usecase.js';
import { UpdateUserStatusUseCase } from '../usecases/admin/update-user-status.usecase.js';
import { CreateTemplateUseCase } from '../usecases/admin/create-template.usecase.js';
import { UpdateTemplateUseCase } from '../usecases/admin/update-template.usecase.js';
import { DeleteTemplateUseCase } from '../usecases/admin/delete-template.usecase.js';
import { ListAuditLogsUseCase } from '../usecases/admin/list-audit-logs.usecase.js';

// Routers
import { createAuthRouter } from './auth.controller.js';
import { createCategoryRouter } from './category.controller.js';
import { createHabitRouter } from './habit.controller.js';
import { createCompletionRouter } from './completion.controller.js';
import { createStreakRouter } from './streak.controller.js';
import { createAnalyticsRouter } from './analytics.controller.js';
import { createTemplateRouter } from './template.controller.js';
import { createAdminRouter } from './admin.controller.js';
import { createHealthRouter } from './health.controller.js';
import { createFocusRouter } from './focus.controller.js';

export function createApiRouter(db: DatabaseType): Router {
  const router = Router();

  const isPostgres =
    (process.env.DATABASE_URL?.startsWith('postgres://') ||
      process.env.DATABASE_URL?.startsWith('postgresql://')) &&
    process.env.NODE_ENV !== 'test';

  // Instantiate Repositories
  const userRepo = isPostgres ? new PgUserRepository() : new SqliteUserRepository(db);
  const categoryRepo = new SqliteCategoryRepository(db);
  const habitRepo = new SqliteHabitRepository(db);
  const completionRepo = new SqliteCompletionRepository(db);
  const streakRepo = new SqliteStreakRepository(db);
  const templateRepo = new SqliteTemplateRepository(db);
  const auditLogRepo = new SqliteAuditLogRepository(db);

  const focusRepo = isPostgres
    ? (new PgFocusRepository() as any)
    : new SqliteFocusRepository(db);

  // Instantiate Infrastructure Services
  const tokenService = new JwtTokenService();
  const passwordHasher = new BcryptPasswordHasher();
  const clockService = new SystemClockService();

  // Instantiate Middleware
  const authMiddleware = createAuthMiddleware(tokenService, userRepo);

  // Instantiate Use Cases
  const registerUseCase = new RegisterUseCase(userRepo, passwordHasher, tokenService);
  const loginUseCase = new LoginUseCase(userRepo, passwordHasher, tokenService);
  const getMeUseCase = new GetMeUseCase(userRepo);

  const getCategoriesUseCase = new GetCategoriesUseCase(categoryRepo);
  const createCategoryUseCase = new CreateCategoryUseCase(categoryRepo);

  const createHabitUseCase = new CreateHabitUseCase(habitRepo, streakRepo, categoryRepo);
  const listHabitsUseCase = new ListHabitsUseCase(habitRepo, streakRepo);
  const getHabitUseCase = new GetHabitUseCase(habitRepo, streakRepo);
  const updateHabitUseCase = new UpdateHabitUseCase(habitRepo, streakRepo, categoryRepo);
  const deleteHabitUseCase = new DeleteHabitUseCase(habitRepo);
  const archiveHabitUseCase = new ArchiveHabitUseCase(habitRepo, streakRepo);

  const logCompletionUseCase = new LogCompletionUseCase(
    completionRepo,
    habitRepo,
    streakRepo,
    userRepo,
    clockService
  );
  const deleteCompletionUseCase = new DeleteCompletionUseCase(
    completionRepo,
    habitRepo,
    streakRepo,
    userRepo,
    clockService
  );
  const getCompletionsUseCase = new GetCompletionsUseCase(completionRepo, habitRepo);

  const getStreakUseCase = new GetStreakUseCase(
    habitRepo,
    streakRepo,
    completionRepo,
    userRepo,
    clockService
  );
  const freezeStreakUseCase = new FreezeStreakUseCase(
    habitRepo,
    streakRepo,
    completionRepo,
    userRepo,
    clockService
  );

  const getAnalyticsSummaryUseCase = new GetAnalyticsSummaryUseCase(
    habitRepo,
    completionRepo,
    streakRepo,
    userRepo,
    clockService
  );
  const getHeatmapUseCase = new GetHeatmapUseCase(
    habitRepo,
    completionRepo,
    userRepo,
    clockService
  );

  const listTemplatesUseCase = new ListTemplatesUseCase(templateRepo);
  const adoptTemplateUseCase = new AdoptTemplateUseCase(templateRepo, habitRepo, streakRepo);

  const getAdminDashboardUseCase = new GetAdminDashboardUseCase(
    userRepo,
    habitRepo,
    completionRepo,
    clockService
  );
  const listAdminUsersUseCase = new ListAdminUsersUseCase(userRepo, habitRepo, streakRepo);
  const updateUserStatusUseCase = new UpdateUserStatusUseCase(userRepo, auditLogRepo);
  const createTemplateUseCase = new CreateTemplateUseCase(templateRepo, categoryRepo, auditLogRepo);
  const updateTemplateUseCase = new UpdateTemplateUseCase(templateRepo, categoryRepo, auditLogRepo);
  const deleteTemplateUseCase = new DeleteTemplateUseCase(templateRepo, auditLogRepo);
  const listAuditLogsUseCase = new ListAuditLogsUseCase(auditLogRepo);

  // Mount Feature Routers
  router.use('/auth', createAuthRouter(registerUseCase, loginUseCase, getMeUseCase, authMiddleware));
  router.use('/categories', createCategoryRouter(getCategoriesUseCase, createCategoryUseCase, authMiddleware));
  router.use(
    '/habits',
    createHabitRouter(
      createHabitUseCase,
      listHabitsUseCase,
      getHabitUseCase,
      updateHabitUseCase,
      deleteHabitUseCase,
      archiveHabitUseCase,
      authMiddleware
    )
  );
  router.use(
    '/habits/:id/completions',
    createCompletionRouter(logCompletionUseCase, deleteCompletionUseCase, getCompletionsUseCase, authMiddleware)
  );
  router.use(
    '/habits/:id/streak',
    createStreakRouter(getStreakUseCase, freezeStreakUseCase, authMiddleware)
  );
  router.use(
    '/analytics',
    createAnalyticsRouter(getAnalyticsSummaryUseCase, getHeatmapUseCase, authMiddleware)
  );
  router.use(
    '/templates',
    createTemplateRouter(listTemplatesUseCase, adoptTemplateUseCase, authMiddleware)
  );
  router.use(
    '/admin',
    createAdminRouter(
      getAdminDashboardUseCase,
      listAdminUsersUseCase,
      updateUserStatusUseCase,
      createTemplateUseCase,
      updateTemplateUseCase,
      deleteTemplateUseCase,
      listAuditLogsUseCase,
      authMiddleware
    )
  );
  router.use('/health', createHealthRouter());
  router.use(createFocusRouter(focusRepo, userRepo, tokenService, authMiddleware));

  return router;
}
