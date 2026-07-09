import { Request, Response } from 'express'
import * as authService from '../services/authService'
import { loginBody, registerBody } from '../validators/userValidator'
import { AppError } from '../utils/AppError'
import * as jwt from 'jsonwebtoken'

export async function register_account(req: Request<{}, {}, registerBody>,
                                       res: Response) {
    const result = await authService.createUser(req.body);
    const tokens = await authService.authInit({ userId: result._id.toString(), isAdmin: result.isAdmin });
    res.cookie('token', tokens.token, { maxAge: 15 * 60 * 1000, 
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' });
    res.cookie('rToken', tokens.refreshToken, { maxAge: 3 * 24 * 60 * 60 * 1000, 
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' });

    res.status(201).json(result);
};

export async function login_account(req: Request<{}, {}, loginBody>,
                                       res: Response) {
    const result = await authService.loginUser(req.body);
    const tokens = await authService.authInit({ userId: result._id.toString(), isAdmin: result.isAdmin });
    res.cookie('token', tokens.token, { maxAge: 15 * 60 * 1000, 
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' });
    res.cookie('rToken', tokens.refreshToken, { maxAge: 3 * 24 * 60 * 60 * 1000, 
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' });

    res.json(result);
};

export async function logout_current(req: Request, res: Response) {
    const rToken = req.cookies.rToken;
    if (rToken) { 
        const payload = jwt.decode(rToken) as jwt.JwtPayload & { userId: string };
        if (payload?.userId) await authService.logoutUser(payload.userId);
    }

    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
    });
    res.clearCookie("rToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
    });
    res.json({ message: 'Logged out successfully.' });
};

export async function refresh_jwt(req: Request, res: Response) {
    const currentRt = req.cookies.rToken;
    if (!currentRt) throw new AppError('No refresh token found.', 400);
    
    const rotatePayload = await authService.rotateRefreshToken(currentRt);
    const tokens = await authService.authInit({ userId: rotatePayload.userId, isAdmin: rotatePayload.isAdmin }, rotatePayload.expiresAt);
    res.cookie('token', tokens.token, { maxAge: 15 * 60 * 1000, 
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' });
    res.cookie('rToken', tokens.refreshToken, { maxAge: rotatePayload.expiresAt.getTime() - Date.now(), 
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' });

    res.json({ message: 'Access token refreshed.' });
};

