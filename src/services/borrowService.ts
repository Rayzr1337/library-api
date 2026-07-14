import Borrow from '../models/borrowRecord'
import Book from '../models/book'
import { BorrowQuery } from '../validators/queryValidator'
import { AppError } from '../utils/AppError'
import { Types } from 'mongoose' 

export async function getBorrows(id: string, query: BorrowQuery) {
    const { page, limit, returned, sort, order } = query;

    const filter: Record<string, any> = { user: id };
    if (returned !== undefined) {
        filter.returnDate = returned ? { $ne: null } : null;
    }

    const sortObj: Record<string, 1 | -1> = sort ? {[sort]: order === 'asc' ? 1 : -1} : { 'borrowDate': -1 };

    const [borrows, totalItems] = await Promise.all([
        Borrow.find(filter)
            .sort(sortObj)
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('book'),
        Borrow.countDocuments(filter)
    ]);

    return {
        data: borrows,
        pagination: {
            page,
            limit,
            totalItems,
            totalPages: Math.ceil(totalItems / limit)
        }
    };
};

export async function getRecentBorrows(query: BorrowQuery) {
    const { page, limit, returned, sort, order } = query;

    const filter: Record<string, any> = {};
    if (returned !== undefined) {
        filter.returnDate = returned ? { $ne: null } : null;
    }

    const sortObj: Record<string, 1 | -1> = { createdAt: -1 };
    if (sort) sortObj[sort] = order === 'asc' ? 1 : -1;

    const [borrows, totalItems] = await Promise.all([
        Borrow.find(filter)
            .sort(sortObj)
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('book user'),
        Borrow.countDocuments(filter)
    ]);

    return {
        data: borrows,
        pagination: {
            page,
            limit,
            totalItems,
            totalPages: Math.ceil(totalItems / limit)
        }
    };
};

export async function createBorrow(user: string, bookId: string) {
    const book = await Book.findOne({ id: bookId });
    if (!book) throw new AppError('Book not found', 404);
    if (!book.available) throw new AppError('Book is not available', 400);

    const existing = await Borrow.findOne({
        book: book._id,
        user,
        returnDate: null
    });
    if (existing) throw new AppError('You already have this book borrowed!', 400);
    const record = await Borrow.create({
        book: book._id,
        user,
        returnDate: null
    });
    await Book.findOneAndUpdate({ id: bookId }, { available: false });
    return record;
};

export async function returnBorrowed(user: string, book: string) {
    const exist = await Book.findOne({ id: book });
    if (!exist) throw new AppError('Book not found', 404);
    const record = await Borrow.findOne({
            book: exist._id, 
            user: new Types.ObjectId(user.toString()), 
            returnDate: null });
    if (!record) throw new AppError('Borrow record does not exist.', 404);
    
    record.returnDate = new Date();
    await record.save();
    await Book.findOneAndUpdate({ id: book }, { available: true });

    return record;
};








