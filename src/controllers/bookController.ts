import { Request, Response } from 'express'
import * as bookService from '../services/bookService'
import { bookBody, bookUpdate } from '../validators/bookValidator'
import { BookQuery } from '../validators/queryValidator'
import { AppError } from '../utils/AppError'

export async function get_books(req: Request<{}, {}, {}, BookQuery>, res: Response) {
    const result = await bookService.getBooks(req.parseQuery as BookQuery);
    res.json(result);
};

export async function create_book(req: Request<{}, {}, bookBody>, res: Response) {
    const cover = req.file?.filename;
    if (!cover) throw new AppError('Book cover image required!', 400);
    const result = await bookService.addBook({ ...req.body, cover }); 
    res.status(201).json(result);
};

export async function get_book_by_id(req : Request<{id: string}>, res: Response) {
    const result = await bookService.getBookById(req.params.id); 
    res.json(result);
};

export async function delete_book(req : Request<{id: string}>, res: Response) {
    const result = await bookService.deleteBook(req.params.id);
    res.json({ message: "Book deleted successfully. "});
};


export async function update_book(req : Request<{id: string}, {}, bookBody>, res: Response) {
    const cover = req.file?.filename;
    const result = await bookService.updateBook(req.params.id, {...req.body, ...(cover && { cover }) }); 
    res.json(result);
};

export async function get_next_id(req: Request, res: Response) {
    const result = await bookService.getNextId();
    res.json({ nextId: result });
};

