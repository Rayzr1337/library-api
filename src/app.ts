import express from 'express'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import morgan from 'morgan'

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

const app = express();

app.use(helmet());
app.use(express.json());
app.use(morgan('dev'));
app.use(cookieParser());
app.use(passport.initialize());
app.use('/uploads', express.static('uploads'));

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

const main = async () => {
    try {
        if (!process.env.DB_URL) throw new Error("Database URL not found.");
        await mongoose.connect(process.env.DB_URL);

        app.use('/api', apiLimit);

        app.use('/api', authRouter);
        app.use('/api', bookRouter);
        app.use('/api', borrowRouter);
        app.use('/api', userRouter);

        app.use((req, res, next) => {
            next(new AppError('Route not found', 404))
        })
        app.use(globalErrorHandler);
        app.listen(process.env.PORT, () => console.log(`[+] Listening on port ${process.env.PORT}`));
    } catch (err: unknown) {
        if (err instanceof Error) {
            console.log(`Error starting server: ${err.message}`);
        } else {
            console.log("Error starting server!");
        }
    }
}; 

mongoose.connection.on('error', (err) => {
    console.log(`Database connection error: ${err.message}`)
});

mongoose.connection.on('disconnected', () => {
    console.log('Database disconnected')
});

main();

process.on('uncaughtException', err => {
    console.log(`Uncaught Exception: ${err.message}`);
    process.exit(1);
});

process.on('unhandledRejection', err => {
    console.log(`Unhandled Rejection: ${err}`);
    process.exit(1);
});

