import { AppError } from '../utils/AppError'
import { Request, Response, NextFunction } from 'express'
import { ZodSchema } from 'zod'

export function validate(schema: ZodSchema) {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            throw new AppError(result.error.flatten().fieldErrors, 400);
        }
        req.body = result.data;
        next();
    };
};

export function validateQuery(schema: ZodSchema) {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.query);
        if (!result.success) {
            throw new AppError(result.error.flatten().fieldErrors, 400);
        }
        req.parseQuery = result.data as any;
        next();
    }
}
