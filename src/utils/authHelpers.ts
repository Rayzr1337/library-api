import * as jwt from 'jsonwebtoken'
import { Response } from 'express' 

const secret = process.env.JWT_SECRET;

interface IAuthUser {
    userId: string,
    isAdmin: boolean
};

export function attachAuthCookie(res: Response, user: IAuthUser) {
    if (!secret) throw new Error('JWT Secret is not defined!');

    const token = jwt.sign(user, 
        secret,
        { expiresIn: '3d' });
    
    res.cookie('token', token, { maxAge: 3 * 24 * 60 * 60 * 1000, 
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' });
}
