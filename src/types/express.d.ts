import { BookQuery, BorrowQuery } from "../validators/queryValidator"

declare global {    
    namespace Express {
        interface User {
            userId: string;
            isAdmin: boolean;
        }

        interface Request {
            parseQuery: BookQuery | BorrowQuery;
        }
    }
}

export {};
