import { BookQuery, BorrowQuery } from "../validators/queryValidator"

declare global {    
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                isAdmin: boolean;
            };
            parseQuery: BookQuery | BorrowQuery
        }
    }
}

export {};
