import { Request, Response, NextFunction } from 'express'
import { AppError } from '../utils/AppError'

export function isUser(req: Request, res: Response, next: NextFunction) {
   if (!req.session.userId) {
        return next(new AppError('Not logged in.', 401));
    }

    next();
}

export function isAdmin(req: Request, res: Response, next: NextFunction) {
   if (!req.session.userId || !req.session.isAdmin) {
        return next(new AppError('Action unauthorized: not logged in as an admin.', 403));
    }

    next();
}
