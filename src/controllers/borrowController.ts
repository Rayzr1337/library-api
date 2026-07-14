import { Request, Response } from 'express'
import * as borrowService from '../services/borrowService'
import { BorrowQuery } from '../validators/queryValidator'

export async function get_borrows(req: Request<{}, {}, {}, BorrowQuery>, res: Response) {
    const result = await borrowService.getBorrows(req.user!.userId, req.parseQuery as BorrowQuery);
    res.json(result);
};

export async function get_recent_borrows(req: Request<{}, {}, {}, BorrowQuery>, res: Response) {
    const result = await borrowService.getRecentBorrows(req.parseQuery as BorrowQuery);
    res.json(result);
};

export async function create_borrow_record(req: Request<{}, {}, 
                                          { bookId: string }>, 
                                          res: Response) {
    const result = await borrowService.createBorrow(req.user!.userId, req.body.bookId);
    res.status(201).json(result);
};


export async function return_book(req: Request<{id: string}>, res: Response) {
    const result = await borrowService.returnBorrowed(req.user!.userId, req.params.id);
    res.json(result);
};
