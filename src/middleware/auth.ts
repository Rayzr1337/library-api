import { Request, Response, NextFunction } from 'express'
import { AppError } from '../utils/AppError'
import * as jwt from 'jsonwebtoken'

const secret = process.env.JWT_SECRET;

export function isUser(req: Request, res: Response, next: NextFunction) {
   if (!secret) throw new Error('JWT Secret is not defined!');

    const token = req.cookies.token;

    if (!token) {
        return next(new AppError("Not logged in.", 401));
    }

    try {
        const payload = jwt.verify(token, secret) as jwt.JwtPayload & { userId: string, isAdmin: boolean };
        req.user = payload;

        return next();
    } catch {
        return next(new AppError("Invalid or expired token!", 401));
    };
}

export function isAdmin(req: Request, res: Response, next: NextFunction) {
   if (!req.user?.isAdmin) {
        return next(new AppError('Action unauthorized: not logged in as an admin.', 403));
    }

    next();
}
