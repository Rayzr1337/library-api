import { Router } from 'express'
import * as borrowController from '../controllers/borrowController'
import { validate } from '../middleware/validate'
import { borrowSchema } from '../validators/borrowValidator' 
import { asyncErrorHandler } from '../middleware/errorHandler'
import { isUser, isAdmin } from '../middleware/auth'
const router = Router();

router.get('/borrow', isUser, asyncErrorHandler(borrowController.get_borrows));
router.get('/borrow/recent', isAdmin, asyncErrorHandler(borrowController.get_recent_borrows));
router.post('/borrow', isUser, validate(borrowSchema), asyncErrorHandler(borrowController.create_borrow_record));
router.post('/borrow/return/:id', isUser, asyncErrorHandler(borrowController.return_book));

export default router;

