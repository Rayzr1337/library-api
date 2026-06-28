import User from '../models/user'
import { registerBody, loginBody } from '../validators/userValidator'
import { AppError } from '../utils/AppError'
import bcrypt from 'bcrypt'

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

