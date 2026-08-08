import { Types } from 'mongoose'
import Book from '../../src/models/book'
import Borrow from '../../src/models/borrowRecord'

const defaultBook = {
  author: 'Author',
  category: 'fantasy',
  description: 'Description',
  cover: 'cover.jpg',
  available: true,
};

export async function seedBook(id: string, name: string, overrides = {}) {
  return Book.create({
    id,
    name,
    ...defaultBook,
    ...overrides,
  });
}

export async function seedBorrowRecord(
  book: string | Types.ObjectId,
  user: string | Types.ObjectId,
  overrides = {},
) {
  return Borrow.create({
    book,
    user,
    returnDate: null,
    ...overrides,
  });
}