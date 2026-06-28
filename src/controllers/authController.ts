import { NextFunction, Request, Response } from 'express'
import * as authService from '../services/authService'
import { loginBody, registerBody } from '../validators/userValidator'
import { AppError } from '../utils/AppError'

export async function register_account(req: Request<{}, {}, registerBody>,
                                       res: Response) {
    const result = await authService.createUser(req.body);
    req.session.userId = result._id.toString();
    req.session.isAdmin = result.isAdmin;
    res.status(201).json(result);
};

export async function login_account(req: Request<{}, {}, loginBody>,
                                       res: Response) {
    const result = await authService.loginUser(req.body);
    req.session.userId = result._id.toString();
    req.session.isAdmin = result.isAdmin;
    res.json(result);
};

export async function logout_current(req: Request, res: Response, next: NextFunction) {
    req.session.destroy(err => {
        if (err) return next(new AppError(err.message, 400));
        res.json({message: 'Logged out successfully.'});
    })
};

