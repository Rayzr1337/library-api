import { Router } from 'express'
import * as authController from '../controllers/authController'
import { validate } from '../middleware/validate'
import { registerSchema, loginSchema } from '../validators/userValidator' 
import { asyncErrorHandler } from '../middleware/errorHandler'
import { isUser } from '../middleware/auth'

const router = Router();

router.post('/auth/login', validate(loginSchema), asyncErrorHandler(authController.login_account));
router.post('/auth/signup', validate(registerSchema), asyncErrorHandler(authController.register_account));
router.post('/auth/logout', isUser, asyncErrorHandler(authController.logout_current));

export default router;
