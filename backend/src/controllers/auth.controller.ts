import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { RegisterUseCase } from '../usecases/auth/register.usecase.js';
import { LoginUseCase } from '../usecases/auth/login.usecase.js';
import { GetMeUseCase } from '../usecases/auth/get-me.usecase.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { authRateLimiter } from '../middleware/rate-limit.middleware.js';
import { smtpService } from '../infrastructure/email/smtp-service.js';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(2).max(100),
  timezone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const sendSmtpOtpSchema = z.object({
  email: z.string().email(),
});

const verifySmtpOtpSchema = z.object({
  email: z.string().email(),
  code: z.string().min(4).max(10),
});

export function createAuthRouter(
  registerUseCase: RegisterUseCase,
  loginUseCase: LoginUseCase,
  getMeUseCase: GetMeUseCase,
  authMiddleware: any
): Router {
  const router = Router();

  router.post(
    '/register',
    authRateLimiter,
    validateBody(registerSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await registerUseCase.execute(req.body);
        res.status(201).json({
          success: true,
          data: result,
        });
      } catch (err) {
        next(err);
      }
    }
  );

  router.post(
    '/login',
    authRateLimiter,
    validateBody(loginSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await loginUseCase.execute(req.body);
        res.status(200).json({
          success: true,
          data: result,
        });
      } catch (err) {
        next(err);
      }
    }
  );

  router.get('/me', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await getMeUseCase.execute(req.user!.id);
      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (err) {
      next(err);
    }
  });

  router.post(
    '/send-smtp-otp',
    authRateLimiter,
    validateBody(sendSmtpOtpSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { email } = req.body;
        const result = await smtpService.sendOtp(email);
        if (!result.success) {
          res.status(400).json({ success: false, error: result.error });
          return;
        }
        res.status(200).json({
          success: true,
          message: 'Verification code sent successfully via SMTP',
          code: process.env.NODE_ENV === 'test' ? result.code : undefined,
        });
      } catch (err) {
        next(err);
      }
    }
  );

  router.post(
    '/verify-smtp-otp',
    authRateLimiter,
    validateBody(verifySmtpOtpSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { email, code } = req.body;
        const result = smtpService.verifyOtp(email, code);
        if (!result.success) {
          res.status(400).json({ success: false, error: result.error });
          return;
        }
        res.status(200).json({
          success: true,
          message: 'Email OTP verified successfully',
        });
      } catch (err) {
        next(err);
      }
    }
  );

  return router;
}
