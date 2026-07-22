import { Router } from 'express';
import { authController } from './auth.controller';
import { registerSchema, loginSchema } from './auth.validation';
import { validate } from '@middleware/validate';
import { authenticate } from '@middleware/authenticate';
import { rateLimiter } from '@middleware/rateLimiter';
import { RATE_LIMITS } from '@shared/constants';

const router = Router();

const authRateLimit = rateLimiter({ ...RATE_LIMITS.AUTH, keyPrefix: 'auth' });

router.post('/register', authRateLimit, validate({ body: registerSchema }), authController.register);
router.post('/login', authRateLimit, validate({ body: loginSchema }), authController.login);
router.post('/refresh', authRateLimit, authController.refresh);
router.post('/logout', authController.logout);
router.post('/logout-all', authenticate, authController.logoutAll);

export default router;
