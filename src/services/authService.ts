import * as jwt from 'jsonwebtoken'
import User from '../models/user'
import RefreshToken from '../models/refreshToken'
import { registerBody, loginBody } from '../validators/userValidator'
import { AppError } from '../utils/AppError'
import bcrypt from 'bcrypt'
import crypto from 'crypto'

const secret = process.env.JWT_SECRET;

interface IAuthUser {
    userId: string,
    isAdmin: boolean
};

export async function createUser(user: registerBody) {
    const { username, email, password } = user;

    const findUsername = await User.findOne({ username });
    if (findUsername) throw new AppError('Username already in use!', 409);

    const findEmail = await User.findOne({ email });
    if (findEmail) throw new AppError('Email already in use!', 409);

    const pwdHash = await bcrypt.hash(password, 10);
    return await User.create({
        ...user,
        password: pwdHash
    });

};

export async function loginUser(user: loginBody) {
    const { username, password } = user;

    const findUsername = await User.findOne({ username });
    if (!findUsername) throw new AppError('Invalid credentials!', 401);

    const pwdMatch = await bcrypt.compare(password, findUsername.password);
    if (!pwdMatch)  throw new AppError('Invalid credentials!', 401);

    return findUsername;
};

export async function logoutUser(userId: string) {
    await RefreshToken.deleteMany({ user: userId })
};

export async function authInit(user: IAuthUser, expiresAt?: Date) {
    if (!secret) throw new Error('JWT Secret is not defined!');

    const token = jwt.sign(user, 
        secret,
        { expiresIn: '15m' });

    const refreshToken = jwt.sign({ userId: user.userId },
                                   secret,
                                   { expiresIn: '3d' });
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    await RefreshToken.create({ user: user.userId,
                          tokenHash: refreshTokenHash,
                          expiresAt: expiresAt ?? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) });

    return { token, refreshToken };
};

export async function rotateRefreshToken(token: string) {
    if (!secret) throw new Error('JWT Secret is not defined!');

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    try {
        const payload = jwt.verify(token, secret) as jwt.JwtPayload & { userId: string };
        const deleteResult = await RefreshToken.findOneAndDelete({ tokenHash });
        
        if (!deleteResult) throw new Error()

        const user = await User.findById(payload.userId).select('isAdmin');
        if (!user) throw new AppError('User no longer exists!', 404);

        return { userId: payload.userId, isAdmin: user.isAdmin, expiresAt: deleteResult.expiresAt };
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError("Invalid/Expired refresh token.", 401);
    }
};
