import express from 'express'
import dotenv from 'dotenv'
import morgan from 'morgan'
import { v2 as cloudinary } from 'cloudinary' 

dotenv.config();

import passport from 'passport'
import './services/passport'

import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'

import { globalErrorHandler } from './middleware/errorHandler'
import { AppError } from './utils/AppError'
import authRouter from './routes/auth'
import bookRouter from './routes/books'
import borrowRouter from './routes/borrows'
import userRouter from './routes/users'

export function createApp() {
    const app = express();

    app.set('trust proxy', 1);
    app.use(helmet());
    app.use(express.json());
    app.use(morgan('dev'));
    app.use(cookieParser());
    app.use(passport.initialize());

    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME as string,
        api_key: process.env.CLOUDINARY_API_KEY as string,
        api_secret: process.env.CLOUDINARY_API_SECRET as string
    });

    const apiLimit = rateLimit({
      windowMs: 15 * 60 * 1000, 
      max: 100, 
      standardHeaders: 'draft-7', 
      legacyHeaders: false, 
      message: {
        status: 429,
        message: 'Too many requests from this IP, please try again later.'
      }
    });

    app.use('/api', apiLimit);

    app.use('/api', authRouter);
    app.use('/api', bookRouter);
    app.use('/api', borrowRouter);
    app.use('/api', userRouter);

    app.use((req, res, next) => {
        next(new AppError('Route not found', 404))
    })
    app.use(globalErrorHandler);

    return app;
};
