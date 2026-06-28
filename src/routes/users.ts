import { Router } from 'express'
import * as userController from '../controllers/userController'
import { validate } from '../middleware/validate'
import { userSchema } from '../validators/userValidator' 
import { asyncErrorHandler } from '../middleware/errorHandler'
import { isUser } from '../middleware/auth'

const router = Router();

router.get('/user/me', isUser, asyncErrorHandler(userController.get_current_user));
router.put('/user/me', isUser, validate(userSchema), asyncErrorHandler(userController.update_user));

export default router;
