import { Router } from 'express'
import * as authController from '../controllers/authController'
import { validate } from '../middleware/validate'
import { registerSchema, loginSchema } from '../validators/userValidator' 
import { asyncErrorHandler } from '../middleware/errorHandler'
import passport from 'passport'
import rateLimit from 'express-rate-limit'

const router = Router();

const authLimit = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5, 
  standardHeaders: 'draft-7', 
  legacyHeaders: false, 
  message: {
    status: 429,
    message: 'Too many login/signup attempts. Please try again in 15 minutes.'
  }
});

router.post('/auth/login', authLimit, validate(loginSchema), asyncErrorHandler(authController.login_account));
router.post('/auth/signup', authLimit, validate(registerSchema), asyncErrorHandler(authController.register_account));
router.post('/auth/logout', asyncErrorHandler(authController.logout_current));
router.post('/auth/refresh', asyncErrorHandler(authController.refresh_jwt));
router.get('/auth/google', passport.authenticate('google'));
router.get('/auth/github', passport.authenticate('github'), (err, user, info) => {
    console.log("err:", err);
    console.log("info:", info);
    console.log("user:", user)
});

router.get('/auth/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/api/auth/failure' }),
    authController.oauth2_handle
);

router.get('/auth/github/callback',
    passport.authenticate('github', { session: false, failureRedirect: '/api/auth/failure' }),
    authController.oauth2_handle 
);

router.get('/auth/failure', (req, res) => {
    res.status(401).json({ error: 'OAuth authentication failed' })
})


export default router;
