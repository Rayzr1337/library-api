import Book from '../models/book'
import { bookBody } from '../validators/bookValidator'
import { AppError } from '../utils/AppError'

export async function getNextId() {
    const lastBook = await Book.findOne().sort({ createdAt: -1 });
    if (!lastBook) { return `B-00001` }
    const nextNum = Number(lastBook.get('id').slice(2)) + 1;
    return `B-${String(nextNum).padStart(5, '0')}`;
}

export async function getBooks() {
    return Book.find();
};

export async function getBookById(id: string) {
    const result = await Book.findOne({ id });
    if (!result) throw new AppError('Book not found.', 404);
    return result;
};

export async function deleteBook(id: string) {
    const result = await Book.findOneAndDelete({ id });
    if (!result) throw new AppError('Book not found.', 404);
    return result;
};

export async function addBook(book: bookBody) {
    const id = await getNextId();
    return Book.create({id: id, ...book})
};

export async function updateBook(id: string, newBook: bookBody) {
    const result = await Book.findOneAndUpdate({ id }, newBook, { new: true });
    if (!result) throw new AppError('Book not found.', 404);
    return result;
};





