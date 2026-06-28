import User from '../models/user'
import { userBody } from '../validators/userValidator'
import { AppError } from '../utils/AppError'
import { Types } from 'mongoose'

export async function getUser(id: string) {
    const result = await User.findById(id);
    if (!result) throw new AppError('User not found!', 404);
    
    return result;
};

export async function updateUser(id: string, newUser: userBody) {
    const result = await User.findByIdAndUpdate(id, newUser, { new: true });
    if (!result) throw new AppError('User not found!', 404);
    
    return result;
};






