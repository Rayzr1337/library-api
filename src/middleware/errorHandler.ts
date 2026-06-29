import { Request, Response, NextFunction } from 'express'
import { AppError } from '../utils/AppError' 

type controllerFunc = (req: Request<any>, res: Response, next: NextFunction) => Promise<any>

export function globalErrorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
    if (err instanceof AppError) {
        res.status(err.statusCode).json(
            err.data ? { errors: err.data } : { error : err.message }
        );
    } else if ((err as any).name === 'CastError') {
        res.status(400).json({ error: 'Invalid ID format' })
    } else if ((err as any).code === 11000) {
        res.status(409).json({ error: 'Duplicate entry' })
    } else {
        res.status(500).json({ error: `Internal Server Error: ${(err as any).message} `});
    }
};

export function asyncErrorHandler(f: controllerFunc) {
    return (req: Request, res: Response, next: NextFunction) => {
        f(req, res, next).catch(next);
    }
};
