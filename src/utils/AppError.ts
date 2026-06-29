export class AppError extends Error {
    statusCode: number
    isOperational: boolean = true
    data?: object

    constructor(msg: string | object, statusCode: number = 500) {
        super(typeof msg === 'string' ? msg : 'Validation error')
        this.statusCode = statusCode
        if (typeof msg === 'object') this.data = msg 
        this.statusCode = statusCode;
    };
};
