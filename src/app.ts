import express from 'express'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import morgan from 'morgan'
import session from 'express-session'
import MongoStore from 'connect-mongo'
import { globalErrorHandler } from './middleware/errorHandler'
import { AppError } from './utils/AppError'

import authRouter from './routes/auth'
import bookRouter from './routes/books'
import borrowRouter from './routes/borrows'
import userRouter from './routes/users'

dotenv.config();
const app = express();
app.use(express.json());
app.use(morgan('dev'));

app.use(session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.DB_URL!,
        collectionName: 'sessions'
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 2
    }
}));


const main = async () => {
    try {
        if (!process.env.DB_URL) throw new Error("Database URL not found.");
        await mongoose.connect(process.env.DB_URL);

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

