export class AppError extends Error {
    statusCode: number
    isOperational: boolean = true

    constructor(msg: string, statusCode: number = 500) {
        super(msg);
        this.statusCode = statusCode;
    };
};
