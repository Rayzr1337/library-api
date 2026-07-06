import Borrow from '../models/borrowRecord'
import Book from '../models/book'
import { AppError } from '../utils/AppError'
import { Types } from 'mongoose' 

export async function getBorrows(id: string) {
    return Borrow.find({ user: id }).populate('book');
};

export async function getRecentBorrows() {
    return Borrow.find().populate('book user').sort({ createdAt: -1 });
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








