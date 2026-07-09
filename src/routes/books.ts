import { Router } from 'express'
import * as bookController from '../controllers/bookController'
import { validate } from '../middleware/validate'
import { bookSchema } from '../validators/bookValidator' 
import { asyncErrorHandler } from '../middleware/errorHandler'
import { isUser, isAdmin } from '../middleware/auth'
import { upload } from '../middleware/upload'

const router = Router();

router.get('/books', asyncErrorHandler(bookController.get_books));
router.get('/books/next-id', isUser, isAdmin, asyncErrorHandler(bookController.get_next_id));
router.get('/books/:id', asyncErrorHandler(bookController.get_book_by_id));
router.post('/books', isUser, isAdmin, upload.single('cover'), validate(bookSchema), asyncErrorHandler(bookController.create_book));
router.put('/books/:id', isUser, isAdmin, upload.single('cover'), validate(bookSchema), asyncErrorHandler(bookController.update_book));
router.delete('/books/:id', isUser, isAdmin, asyncErrorHandler(bookController.delete_book));

export default router;
