import { Request, Response } from 'express'
import * as authService from '../services/authService'
import { loginBody, registerBody } from '../validators/userValidator'
import { attachAuthCookie } from '../utils/authHelpers'

export async function register_account(req: Request<{}, {}, registerBody>,
                                       res: Response) {
    const result = await authService.createUser(req.body);
    attachAuthCookie(res, { userId: result._id.toString(), isAdmin: result.isAdmin });
    res.status(201).json(result);
};

export async function login_account(req: Request<{}, {}, loginBody>,
                                       res: Response) {
    const result = await authService.loginUser(req.body);
    attachAuthCookie(res, { userId: result._id.toString(), isAdmin: result.isAdmin });
    res.json(result);
};

export async function logout_current(req: Request, res: Response) {
    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
    });
    res.json({ message: 'Logged out successfully.' });
}

