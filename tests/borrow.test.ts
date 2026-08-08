import './helpers/db'
import request from 'supertest'
import { createApp } from '../src/app'
import Book from '../src/models/book'
import { loginUser, signupUser } from './helpers/auth'
import { seedBook, seedBorrowRecord } from './helpers/bookBorrow'

jest.mock('express-rate-limit', () => {
    return jest.fn(() => (req: any, res: any, next: any) => next());
});

const app = createApp();

describe("Testing borrow record routes.", () => {
    describe("GET /borrow", () => {
        it("Fetch borrow records returns 200 with paginated data for the user when logged in.", async () => {
        await signupUser(app);
        const loginResponse = await loginUser(app);
        const cookies = loginResponse.headers['set-cookie'] as unknown as string[];

        const book1 = await seedBook('B-00001', 'Book 1');
        const book2 = await seedBook('B-00002', 'Book 2');

        const userId = loginResponse.body._id;
        await seedBorrowRecord(book1._id, userId);
        await seedBorrowRecord(book2._id, userId);
        
        const response = await request(app)
            .get('/api/borrow')
            .set('Cookie', cookies);
        
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data[0].book.id).toBe('B-00002');
        expect(response.body.data[1].book.id).toBe('B-00001');
        expect(response.body.data.length).toBe(2);
        expect(response.body).toHaveProperty('pagination');
        expect(response.body.pagination).toHaveProperty('page', 1);
        expect(response.body.pagination).toHaveProperty('limit', 10);
        });

        it("Fetch borrow records returns 400 with Zod validation errors on invalid query parameters.", async () => {
            await signupUser(app);
            const loginResponse = await loginUser(app);
            const cookies = loginResponse.headers['set-cookie'] as unknown as string[];

            const response = await request(app)
                .get('/api/borrow?page=-1&limit=0')
                .set('Cookie', cookies);

            expect(response.statusCode).toBe(400);
            expect(response.body.errors).toHaveProperty('page');
            expect(response.body.errors).toHaveProperty('limit');
        });

        it("Fetch borrow records returns 200 with correct filtered data when 'returned' query parameter is provided.", async () => {
            await signupUser(app);
            const loginResponse = await loginUser(app);
            const cookies = loginResponse.headers['set-cookie'] as unknown as string[];

            const book1 = await seedBook('B-00001', 'Book 1');
            const book2 = await seedBook('B-00002', 'Book 2');
            const userId = loginResponse.body._id;

            await seedBorrowRecord(book1._id, userId, { returnDate: new Date() });
            await seedBorrowRecord(book2._id, userId);

            const response = await request(app)
                .get('/api/borrow?returned=true')
                .set('Cookie', cookies);

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('data');
            expect(response.body.data.length).toBe(1);
            expect(response.body.data[0].book.id).toBe('B-00001');
            expect(response.body.data[0]).toHaveProperty('returnDate');
        });

        it("Fetch borrow records returns 401 when unauthenticated.", async () => {
            const response = await request(app)
                .get('/api/borrow');

            expect(response.statusCode).toBe(401);
            expect(response.body.error).toBe('Not logged in.');
        });
    });

    describe("GET /borrow/recent", () => {
        it("Fetch recent borrow records returns 400 with Zod validation errors on invalid query parameters.", async () => {
            await signupUser(app, { isAdmin: true });
            const loginResponse = await loginUser(app);
            const cookies = loginResponse.headers['set-cookie'] as unknown as string[];

            const response = await request(app)
                .get('/api/borrow/recent?page=-1&limit=0')
                .set('Cookie', cookies);

            expect(response.statusCode).toBe(400);
            expect(response.body.errors).toHaveProperty('page');
            expect(response.body.errors).toHaveProperty('limit');
        });

        it("Fetch recent borrow records returns 401 when unauthenticated.", async () => {
            const response = await request(app)
                .get('/api/borrow/recent');

            expect(response.statusCode).toBe(401);
            expect(response.body.error).toBe('Not logged in.');
        });

        it("Fetch recent borrow records returns 403 when logged in user is not an admin.", async () => {
            await signupUser(app);
            const loginResponse = await loginUser(app);
            const cookies = loginResponse.headers['set-cookie'] as unknown as string[];

            const response = await request(app)
                .get('/api/borrow/recent')
                .set('Cookie', cookies);

            expect(response.statusCode).toBe(403);
            expect(response.body.error).toBe('Action unauthorized: not logged in as an admin.');
        });

        it("Fetch recent borrow records returns 200 with recents accross all users when logged in as an admin.", async () => {
            await signupUser(app, { isAdmin: true });
            const user2 = await signupUser(app, { username: 'user2', email: 'user2@example.com' });
            const user3 = await signupUser(app, { username: 'user3', email: 'user3@example.com' });
            const loginResponse = await loginUser(app);
            const cookies = loginResponse.headers['set-cookie'] as unknown as string[];

            const book1 = await seedBook('B-00001', 'Book 1');
            const book2 = await seedBook('B-00002', 'Book 2');

            await seedBorrowRecord(book1._id, user2.body._id);
            await seedBorrowRecord(book2._id, user3.body._id);

            const response = await request(app)
                .get('/api/borrow/recent')
                .set('Cookie', cookies);

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('data');
            expect(response.body.data.length).toBe(2);
            expect(response.body.data.map((borrow: { book: { id: string } }) => borrow.book.id)).toEqual(
                expect.arrayContaining(['B-00001', 'B-00002'])
            );
            expect(response.body.data.map((borrow: { user: { username: string } }) => borrow.user.username)).toEqual(
                expect.arrayContaining(['user2', 'user3'])
            );
            expect(response.body).toHaveProperty('pagination');
            expect(response.body.pagination).toHaveProperty('page', 1);
            expect(response.body.pagination).toHaveProperty('limit', 10);
        });

        it("Fetch recent borrow records returns correctly sorted data when 'sort' and 'order' query parameters are provided.", async () => {
            await signupUser(app, { isAdmin: true });
            const user2 = await signupUser(app, { username: 'user2', email: 'user2@example.com' });
            const user3 = await signupUser(app, { username: 'user3', email: 'user3@example.com' });
            const loginResponse = await loginUser(app);
            const cookies = loginResponse.headers['set-cookie'] as unknown as string[];

            const book1 = await seedBook('B-00001', 'Book 1');
            const book2 = await seedBook('B-00002', 'Book 2');

            await seedBorrowRecord(book1._id, user2.body._id, { returnDate: new Date('2024-01-01') });
            await seedBorrowRecord(book2._id, user3.body._id, { returnDate: new Date('2024-02-01') });

            const response = await request(app)
                .get('/api/borrow/recent?sort=returnDate&order=desc')
                .set('Cookie', cookies);

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('data');
            expect(response.body.data.length).toBe(2);
            expect(response.body.data[0].book.id).toBe('B-00002');
            expect(response.body.data[1].book.id).toBe('B-00001');
            expect(response.body.data[0].returnDate).toBe('2024-02-01T00:00:00.000Z');
            expect(response.body.data[1].returnDate).toBe('2024-01-01T00:00:00.000Z');
        });
    });

    describe("POST /borrow", () => {
        it("Create borrow record returns 201 with the created record on valid bookId and marks the book unavailable.", async () => {
            await signupUser(app);
            const loginResponse = await loginUser(app);
            const cookies = loginResponse.headers['set-cookie'] as unknown as string[];
            const book = await seedBook('B-00001', 'Book 1');

            const response = await request(app)
                .post('/api/borrow')
                .set('Cookie', cookies)
                .send({ bookId: 'B-00001' });

            expect(response.statusCode).toBe(201);
            expect(response.body).toHaveProperty('book');
            expect(response.body).toHaveProperty('user');
            expect(response.body).toHaveProperty('returnDate', null);

            const updatedBook = await Book.findOne({ id: book.id });
            expect(updatedBook?.available).toBe(false);
        });

        it("Create borrow record returns 400 with Zod validation errors on invalid or missing body.", async () => {
            await signupUser(app);
            const loginResponse = await loginUser(app);
            const cookies = loginResponse.headers['set-cookie'] as unknown as string[];

            const response = await request(app)
                .post('/api/borrow')
                .set('Cookie', cookies)
                .send({ bookId: '' });

            expect(response.statusCode).toBe(400);
            expect(response.body.errors).toHaveProperty('bookId');
        });

        it("Create borrow record returns 401 with 'Not logged in.' when unauthenticated.", async () => {
            const response = await request(app)
                .post('/api/borrow')
                .send({ bookId: 'B-00001' });

            expect(response.statusCode).toBe(401);
            expect(response.body.error).toBe('Not logged in.');
        });

        it("Create borrow record returns 404 with 'Book not found' on a nonexistent bookId.", async () => {
            await signupUser(app);
            const loginResponse = await loginUser(app);
            const cookies = loginResponse.headers['set-cookie'] as unknown as string[];

            const response = await request(app)
                .post('/api/borrow')
                .set('Cookie', cookies)
                .send({ bookId: 'B-99999' });

            expect(response.statusCode).toBe(404);
            expect(response.body.error).toBe('Book not found');
        });

        it("Create borrow record returns 400 with 'Book is not available' when already checked out.", async () => {
            await signupUser(app);
            const loginResponse = await loginUser(app);
            const cookies = loginResponse.headers['set-cookie'] as unknown as string[];
            await seedBook('B-00001', 'Book 1', { available: false });

            const response = await request(app)
                .post('/api/borrow')
                .set('Cookie', cookies)
                .send({ bookId: 'B-00001' });

            expect(response.statusCode).toBe(400);
            expect(response.body.error).toBe('Book is not available');
        });
    });

    describe("POST /borrow/return/:id", () => {
        it("Return borrowed book returns 200 with the updated record and marks the book available.", async () => {
            await signupUser(app);
            const loginResponse = await loginUser(app);
            const cookies = loginResponse.headers['set-cookie'] as unknown as string[];
            const book = await seedBook('B-00001', 'Book 1');

            await request(app)
                .post('/api/borrow')
                .set('Cookie', cookies)
                .send({ bookId: 'B-00001' });

            const response = await request(app)
                .post('/api/borrow/return/B-00001')
                .set('Cookie', cookies);

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('book');
            expect(response.body).toHaveProperty('user');
            expect(response.body.returnDate).toBeTruthy();

            const updatedBook = await Book.findOne({ id: book.id });
            expect(updatedBook?.available).toBe(true);
        });

        it("Return borrowed book returns 401 with 'Not logged in.' when unauthenticated.", async () => {
            const response = await request(app)
                .post('/api/borrow/return/B-00001');

            expect(response.statusCode).toBe(401);
            expect(response.body.error).toBe('Not logged in.');
        });

        it("Return borrowed book returns 404 with 'Book not found' when the bookId doesn't exist.", async () => {
            await signupUser(app);
            const loginResponse = await loginUser(app);
            const cookies = loginResponse.headers['set-cookie'] as unknown as string[];

            const response = await request(app)
                .post('/api/borrow/return/B-99999')
                .set('Cookie', cookies);

            expect(response.statusCode).toBe(404);
            expect(response.body.error).toBe('Book not found');
        });

        it("Return borrowed book returns 404 with 'Borrow record does not exist.' when no active borrow record exists for that book.", async () => {
            await signupUser(app);
            const loginResponse = await loginUser(app);
            const cookies = loginResponse.headers['set-cookie'] as unknown as string[];
            const book = await seedBook('B-00001', 'Book 1');
            const userId = loginResponse.body._id;

            await seedBorrowRecord(book._id, userId, { returnDate: new Date() });

            const response = await request(app)
                .post('/api/borrow/return/B-00001')
                .set('Cookie', cookies);

            expect(response.statusCode).toBe(404);
            expect(response.body.error).toBe('Borrow record does not exist.');
        });
    });
});
