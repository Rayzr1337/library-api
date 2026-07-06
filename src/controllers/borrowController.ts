import { Request, Response } from 'express'
import * as borrowService from '../services/borrowService'

export async function get_borrows(req: Request, res: Response) {
    const result = await borrowService.getBorrows(req.user?.userId!);
    res.json(result);
};

export async function get_recent_borrows(req: Request, res: Response) {
    const result = await borrowService.getRecentBorrows();
    res.json(result);
};

export async function create_borrow_record(req: Request<{}, {}, 
                                          { bookId: string }>, 
                                          res: Response) {
    const result = await borrowService.createBorrow(req.user?.userId!, req.body.bookId);
    res.status(201).json(result);
};


export async function return_book(req: Request<{id: string}>, res: Response) {
    const result = await borrowService.returnBorrowed(req.user?.userId!, req.params.id);
    res.json(result);
};
