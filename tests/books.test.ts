import './helpers/db'
import request from 'supertest'
import { createApp } from '../src/app'
import Book from '../src/models/book'
import { loginUser, signupUser } from './helpers/auth'

const app = createApp();

async function seedBook(id: string, name: string) {
  return Book.create({
    id,
    name,
    author: 'Author',
    category: 'fantasy',
    description: 'Description',
    cover: 'cover.jpg',
    available: true,
  });
}

jest.mock('express-rate-limit', () => {
  return jest.fn(() => (req: any, res: any, next: any) => next());
});

jest.mock('cloudinary', () => {
    return {
        v2: {
            config: jest.fn(),
            uploader: {
                upload_stream: jest.fn((options, callback) => {
                    const result = {
                        secure_url: 'https://example.com/cover.jpg',
                    };
                    callback(null, result);
                    return {
                        end: jest.fn(),
                    }
                })
            }, 
        }
    }
});

describe("Testing books routes.", () => {
    it("Fetch books turns 200 with paginated data on no query params, sorted by id ascending by default.", async () => {
        await seedBook('B-00003', 'Book 3');
        await seedBook('B-00001', 'Book 1');
        await seedBook('B-00002', 'Book 2');

        const response = await request(app).get('/api/books');

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('pagination');
        expect(response.body.pagination).toHaveProperty('page', 1);
        expect(response.body.pagination).toHaveProperty('limit', 10);
        expect(response.body.pagination).toHaveProperty('totalPages');
        expect(response.body.pagination).toHaveProperty('totalItems');

        const ids = response.body.data.map((book: { id: string }) => book.id);
        expect(ids).toEqual(['B-00001', 'B-00002', 'B-00003']);
    });

    it("Fetch books returns 200 with correctly filtered results when category/author/available are given.", async () => {
        await seedBook('B-00004', 'Book 4');
        await seedBook('B-00005', 'Book 5');
        await Book.create({
            id: 'B-00006',
            name: 'Book 6',
            author: 'Author',
            category: 'dystopia',
            description: 'Description',
            cover: 'cover.jpg',
            available: false,
        });

        const response = await request(app).get('/api/books?category=fantasy&available=true');
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data.length).toBe(2);
        const ids = response.body.data.map((book: { id: string }) => book.id);  
        expect(ids).toEqual(['B-00004', 'B-00005']);
    });

    it("Fetch books returns 200 with correctly sorted results when sort & order is specified.", async () => {
        await seedBook('B-00001', 'A');
        await seedBook('B-00002', 'B');
        await seedBook('B-00003', 'C');

        const response = await request(app).get('/api/books?sort=name&order=desc');

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('data');
        const names = response.body.data.map((book: { name: string }) => book.name);
        expect(names).toEqual(['C', 'B', 'A']);
    });

    it("Fetch books returns 400 with validation errors from Zod when invalid query params are provided.", async () => {
        const response = await request(app).get('/api/books?sort=invalid&order=invalid');

        expect(response.statusCode).toBe(400);
        expect(response.body.errors).toHaveProperty('sort');
        expect(response.body.errors).toHaveProperty('order');
    });

    it("Fetch book with id param returns 200 with book object when a valid id is provided.", async () => {
        await seedBook('B-00001', 'Book 1');   
        const response = await request(app).get('/api/books/B-00001');

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('id', 'B-00001');
        expect(response.body).toHaveProperty('name', 'Book 1');
    });

    it("Fetch book with id param returns 404 with error message when an invalid id is provided.", async () => {
        const response = await request(app).get('/api/books/B-99999');

        expect(response.statusCode).toBe(404);
        expect(response.body.error).toBe('Book not found.');
    });

    it("Fetch next-id endpoint returns 200, B-00001 when no books exist in the DB.", async () => {
        await signupUser(app, { isAdmin: true });
        const loginResponse = await loginUser(app);
        const cookies = loginResponse.headers['set-cookie'] as unknown as string[];
        const response = await request(app)
            .get('/api/books/next-id')
            .set('Cookie', cookies);

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('nextId', 'B-00001');
    });

    it("Fetch next-id endpoint returns 200, B-00004 when 3 books exist in the DB.", async () => {
        await seedBook('B-00001', 'Book 1');
        await seedBook('B-00002', 'Book 2');
        await seedBook('B-00003', 'Book 3');    

        await signupUser(app, { isAdmin: true });
        const loginResponse = await loginUser(app);
        const cookies = loginResponse.headers['set-cookie'] as unknown as string[];
        const response = await request(app)
            .get('/api/books/next-id')
            .set('Cookie', cookies);

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('nextId', 'B-00004');
    });

    it("Fetch next-id endpoint returns 401 when unauthenticated user tries to access it.", async () => {
        const response = await request(app).get('/api/books/next-id');

        expect(response.statusCode).toBe(401);
        expect(response.body.error).toBe('Not logged in.');
    });

    it("Fetch next-id endpoint returns 403 when non-admin user tries to access it.", async () => {
        await signupUser(app);
        const loginResponse = await loginUser(app);
        const cookies = loginResponse.headers['set-cookie'] as unknown as string[];
        const response = await request(app)
            .get('/api/books/next-id')
            .set('Cookie', cookies);

        expect(response.statusCode).toBe(403);
        expect(response.body.error).toBe('Action unauthorized: not logged in as an admin.');
    });

    it("Add book endpoint returns 201 with created book object when valid input is provided by an admin user.", async () => {
        await signupUser(app, { isAdmin: true });
        const loginResponse = await loginUser(app);
        const cookies = loginResponse.headers['set-cookie'] as unknown as string[];
        const response = await request(app)
            .post('/api/books')
            .set('Cookie', cookies)
            .field('name', 'Book 1')
            .field('author', 'Author 1')
            .field('category', 'fantasy')
            .field('description', 'Description 1')
            .attach('cover', Buffer.from('fake image data'), { filename: 'cover.jpg' });
        
        expect(response.statusCode).toBe(201);
        expect(response.body).toHaveProperty('id', 'B-00001');
        expect(response.body).toHaveProperty('name', 'Book 1');
        expect(response.body).toHaveProperty('cover', 'https://example.com/cover.jpg');
        expect(response.body).toHaveProperty('available', true);
        expect(response.body).toHaveProperty('createdAt');
        expect(response.body).toHaveProperty('updatedAt');
    });

    it("Add book endpoint returns 400 with validation errors when invalid input is provided.", async () => {
        await signupUser(app, { isAdmin: true });
        const loginResponse = await loginUser(app);
        const cookies = loginResponse.headers['set-cookie'] as unknown as string[];
        const response = await request(app)
            .post('/api/books')
            .set('Cookie', cookies)
            .field('name', '')
            .field('author', '')
            .field('category', 'invalid-category')
            .field('description', '')
            .attach('cover', Buffer.from('fake image data'), { filename: 'cover.jpg' });
        
        expect(response.statusCode).toBe(400);
        expect(response.body.errors).toHaveProperty('name');
        expect(response.body.errors).toHaveProperty('author');
        expect(response.body.errors).toHaveProperty('category');
        expect(response.body.errors).toHaveProperty('description');
    });

    it("Add book endpoint returns 400 with 'Book cover image required!' error when no cover image is provided.", async () => {
        await signupUser(app, { isAdmin: true });
        const loginResponse = await loginUser(app);
        const cookies = loginResponse.headers['set-cookie'] as unknown as string[];
        const response = await request(app)
            .post('/api/books')
            .set('Cookie', cookies)
            .field('name', 'Book 1')
            .field('author', 'Author 1')
            .field('category', 'fantasy')
            .field('description', 'Description 1');

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe('Book cover image required!');
    });

    it("Add book endpoint returns 401 when unauthenticated user tries to access it.", async () => {
        const response = await request(app)
            .post('/api/books')
            .field('name', 'Book 1')
            .field('author', 'Author 1')
            .field('category', 'fantasy')
            .field('description', 'Description 1')
            .attach('cover', Buffer.from('fake image data'), { filename: 'cover.jpg' });

        expect(response.statusCode).toBe(401);
        expect(response.body.error).toBe('Not logged in.');
    });

    it("Add book endpoint returns 403 when non-admin user tries to access it.", async () => {
        await signupUser(app);
        const loginResponse = await loginUser(app);
        const cookies = loginResponse.headers['set-cookie'] as unknown as string[];
        const response = await request(app)
            .post('/api/books') 
            .set('Cookie', cookies)
            .field('name', 'Book 1')
            .field('author', 'Author 1')
            .field('category', 'fantasy')
            .field('description', 'Description 1')
            .attach('cover', Buffer.from('fake image data'), { filename: 'cover.jpg' });

        expect(response.statusCode).toBe(403);
        expect(response.body.error).toBe('Action unauthorized: not logged in as an admin.');
    });

    it("Add book endpoint returns 500 when a non-image file is provided as cover.", async () => {
        await seedBook('B-00001', 'Book 1');
        await signupUser(app, { isAdmin: true });
        const loginResponse = await loginUser(app);
        const cookies = loginResponse.headers['set-cookie'] as unknown as string[];
        const response = await request(app)
            .post('/api/books')
            .set('Cookie', cookies)
            .field('name', 'Book 1')
            .field('author', 'Author 1')
            .field('category', 'fantasy')
            .field('description', 'Description 1')
            .attach('cover', Buffer.from('fake text data'), { filename: 'cover.txt' });

        expect(response.statusCode).toBe(500);
    });

    it("Add book endpoint returns 409 when race condition occurs.", async () => {
        await seedBook('B-00001', 'Book 1');
        jest.spyOn(Book, 'findOne').mockReturnValue({
            sort: () => Promise.resolve({
                get: () => 'B-00000',
            }),
        } as any);

        await signupUser(app, { isAdmin: true });
        const loginResponse = await loginUser(app);
        const cookies = loginResponse.headers['set-cookie'] as unknown as string[];
        const response = await request(app)
            .post('/api/books')
            .set('Cookie', cookies)
            .field('name', 'Book 1')
            .field('author', 'Author 1')
            .field('category', 'fantasy')
            .field('description', 'Description 1')
            .attach('cover', Buffer.from('fake image data'), { filename: 'cover.jpg' });

        expect(response.statusCode).toBe(409);
        expect(response.body.error).toBe('Duplicate entry');
    });


    it("Update book endpoint returns 200 with updated book when valid input is provided by an admin user.", async () => {
        await seedBook('B-00001', 'Book 1');
        await signupUser(app, { isAdmin: true });
        const loginResponse = await loginUser(app);
        const cookies = loginResponse.headers['set-cookie'] as unknown as string[];
        const response = await request(app)
            .put('/api/books/B-00001')
            .set('Cookie', cookies)
            .field('name', 'Updated Book 1')
            .field('author', 'Updated Author 1')
            .field('category', 'dystopia')
            .field('description', 'Updated Description 1')
            .attach('cover', Buffer.from('fake image data'), { filename: 'cover.jpg' });
        
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('id', 'B-00001');
        expect(response.body).toHaveProperty('name', 'Updated Book 1');
        expect(response.body).toHaveProperty('author', 'Updated Author 1');
        expect(response.body).toHaveProperty('category', 'dystopia');
        expect(response.body).toHaveProperty('description', 'Updated Description 1');
        expect(response.body).toHaveProperty('cover', 'https://example.com/cover.jpg');
    });

    it("Update book endpoint returns 200 with preserving cover when no new cover image is provided.", async () => {
        await seedBook('B-00001', 'Book 1');
        await signupUser(app, { isAdmin: true });
        const loginResponse = await loginUser(app);
        const cookies = loginResponse.headers['set-cookie'] as unknown as string[];
        const response = await request(app)
            .put('/api/books/B-00001')
            .set('Cookie', cookies)
            .field('name', 'Updated Book 1')
            .field('author', 'Updated Author 1')
            .field('category', 'dystopia')
            .field('description', 'Updated Description 1');


        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('id', 'B-00001');
        expect(response.body).toHaveProperty('name', 'Updated Book 1');
        expect(response.body).toHaveProperty('author', 'Updated Author 1');
        expect(response.body).toHaveProperty('category', 'dystopia');
        expect(response.body).toHaveProperty('description', 'Updated Description 1');
        expect(response.body).toHaveProperty('cover', 'cover.jpg');
    });

    it("Update book endpoint returns 404 when trying to update a non-existent book.", async () => {
        await signupUser(app, { isAdmin: true });
        const loginResponse = await loginUser(app);
        const cookies = loginResponse.headers['set-cookie'] as unknown as string[];
        const response = await request(app)
            .put('/api/books/B-99999')
            .set('Cookie', cookies)
            .field('name', 'Updated Book 1')
            .field('author', 'Updated Author 1')
            .field('category', 'dystopia')
            .field('description', 'Updated Description 1')
            .attach('cover', Buffer.from('fake image data'), { filename: 'cover.jpg' });

        expect(response.statusCode).toBe(404);
        expect(response.body.error).toBe('Book not found.');
    });

    it("Update book endpoint returns 401 when unauthenticated user tries to access it.", async () => {
        const response = await request(app)
            .put('/api/books/B-00001')
            .field('name', 'Updated Book 1')
            .field('author', 'Updated Author 1')
            .field('category', 'dystopia')
            .field('description', 'Updated Description 1')
            .attach('cover', Buffer.from('fake image data'), { filename: 'cover.jpg' });

        expect(response.statusCode).toBe(401);
        expect(response.body.error).toBe('Not logged in.');
    });

    it("Update book endpoint returns 403 when non-admin user tries to access it.", async () => {
        await signupUser(app);
        const loginResponse = await loginUser(app);
        const cookies = loginResponse.headers['set-cookie'] as unknown as string[];
        const response = await request(app)
            .put('/api/books/B-00001')
            .set('Cookie', cookies)
            .field('name', 'Updated Book 1')
            .field('author', 'Updated Author 1')
            .field('category', 'dystopia')
            .field('description', 'Updated Description 1')
            .attach('cover', Buffer.from('fake image data'), { filename: 'cover.jpg' });

        expect(response.statusCode).toBe(403);
        expect(response.body.error).toBe('Action unauthorized: not logged in as an admin.');
    });

    it("Update book endpoint returns 500 when a non-image file is provided as cover.", async () => {
        await seedBook('B-00001', 'Book 1');
        await signupUser(app, { isAdmin: true });
        const loginResponse = await loginUser(app);
        const cookies = loginResponse.headers['set-cookie'] as unknown as string[];
        const response = await request(app)
            .put('/api/books/B-00001')
            .set('Cookie', cookies)
            .field('name', 'Book 1')
            .field('author', 'Author 1')
            .field('category', 'fantasy')
            .field('description', 'Description 1')
            .attach('cover', Buffer.from('fake text data'), { filename: 'cover.txt' });

        expect(response.statusCode).toBe(500);
    });

    it("Delete book endpoint returns 200 with 'Book deleted successfully.' when a valid id is provided by an admin user.", async () => {
        await seedBook('B-00001', 'Book 1');
        await signupUser(app, { isAdmin: true });
        const loginResponse = await loginUser(app);
        const cookies = loginResponse.headers['set-cookie'] as unknown as string[];
        const response = await request(app)
            .delete('/api/books/B-00001')
            .set('Cookie', cookies);    

        expect(response.statusCode).toBe(200);
        expect(response.body.message).toBe('Book deleted successfully.');
    });

    it("Delete book endpoint returns 404 when trying to delete a non-existent book.", async () => {
        await signupUser(app, { isAdmin: true });
        const loginResponse = await loginUser(app);
        const cookies = loginResponse.headers['set-cookie'] as unknown as string[];
        const response = await request(app)
            .delete('/api/books/B-99999')
            .set('Cookie', cookies);
        
        expect(response.statusCode).toBe(404);
        expect(response.body.error).toBe('Book not found.');
    });

    it("Delete book endpoint returns 401 when unauthenticated user tries to access it.", async () => {
        const response = await request(app)
            .delete('/api/books/B-00001');
        
        expect(response.statusCode).toBe(401);
        expect(response.body.error).toBe('Not logged in.');
    });
    
    it("Delete book endpoint returns 403 when non-admin user tries to access it.", async () => {
        await signupUser(app);
        const loginResponse = await loginUser(app);
        const cookies = loginResponse.headers['set-cookie'] as unknown as string[];
        const response = await request(app)
            .delete('/api/books/B-00001')
            .set('Cookie', cookies);

        expect(response.statusCode).toBe(403);
        expect(response.body.error).toBe('Action unauthorized: not logged in as an admin.');
    });
});
