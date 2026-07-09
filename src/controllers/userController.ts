import { NextFunction, Request, Response } from 'express'
import * as userService from '../services/userService'
import { userBody } from '../validators/userValidator'
import { AppError } from '../utils/AppError'

export async function get_current_user(req: Request, res: Response) {
    const user = await userService.getUser(req.user!.userId);
    res.json(user);
};

export async function update_user(req: Request<{}, {}, userBody>, res: Response) {
    const result = await userService.updateUser(req.user!.userId, req.body);
    res.json(result);
};


