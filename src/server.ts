import mongoose from 'mongoose'
import { createApp } from './app'

const main = async () => {
    try {
        if (!process.env.DB_URL) throw new Error("Database URL not found.");
        await mongoose.connect(process.env.DB_URL);

        const app = createApp();
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
