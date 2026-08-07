import './helpers/db'
import request from 'supertest'
import { createApp } from '../src/app'
import User from '../src/models/user'
import { loginUser, signupUser } from './helpers/auth'

const app = createApp();

jest.mock('express-rate-limit', () => {
  return jest.fn(() => (req: any, res: any, next: any) => next());
});

describe("Testing current user route.", () => {
    it("Fetch current user returns 200 with user data upon making request with valid token.", async () => {
        await signupUser(app);
        const loginResponse = await loginUser(app);
        const cookies = loginResponse.headers['set-cookie'] as unknown as string[];
        const response = await request(app)
            .get('/api/user/me')
            .set('Cookie', cookies);
        
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('username', 'testuser1');
        expect(response.body).toHaveProperty('email', 'testuser1@example.com');
    })

    it("Fetch current user returns 401 with error message when no access token is provided.", async () => {
        const response = await request(app)
            .get('/api/user/me');
        
        expect(response.statusCode).toBe(401);
        expect(response.body.error).toBe('Not logged in.');
    });

    it("Fetch current user returns 401 with error message when an invalid access token is provided.", async () => {
        const response = await request(app)
            .get('/api/user/me')
            .set('Cookie', ['token=invalidtoken']);

        expect(response.statusCode).toBe(401);
        expect(response.body.error).toBe('Invalid or expired token!');
    });

    it("Fetch current user returns 404 with error message when the token's user no longer exists in DB.", async () => {
        await signupUser(app);
        const loginResponse = await loginUser(app);
        const cookies = loginResponse.headers['set-cookie'] as unknown as string[];

        await User.deleteOne({ username: 'testuser1' });

        const response = await request(app)
            .get('/api/user/me')
            .set('Cookie', cookies);
        
        expect(response.statusCode).toBe(404);
        expect(response.body.error).toBe('User not found!');
    });

    it("Update current user returns 200 with updated user object on valid input & valid token.", async () => {
        await signupUser(app);
        const loginResponse = await loginUser(app);
        const cookies = loginResponse.headers['set-cookie'] as unknown as string[];
        const response = await request(app)
            .put('/api/user/me')
            .set('Cookie', cookies)
            .send({
                ...loginResponse.body,
                firstName: 'UpdatedFirstName',
                lastName: 'UpdatedLastName'
            });
        
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('firstName', 'UpdatedFirstName');
        expect(response.body).toHaveProperty('lastName', 'UpdatedLastName');
    });

    it("Update current user returns 400 with validation errors from Zod on invalid input.", async () => {
        await signupUser(app);
        const loginResponse = await loginUser(app);
        const cookies = loginResponse.headers['set-cookie'] as unknown as string[];
        const response = await request(app)
            .put('/api/user/me')
            .set('Cookie', cookies)
            .send({
                ...loginResponse.body,
                firstName: '',
                lastName: true
            });
        
        expect(response.statusCode).toBe(400);
        expect(response.body.errors).toHaveProperty('firstName');
        expect(response.body.errors).toHaveProperty('lastName');
    });

    it("Update current user returns 404 with error message when the token's user no longer exists in DB.", async () => {
        await signupUser(app);
        const loginResponse = await loginUser(app);
        const cookies = loginResponse.headers['set-cookie'] as unknown as string[];

        await User.deleteOne({ username: 'testuser1' });

        const response = await request(app)
            .put('/api/user/me')
            .set('Cookie', cookies)
            .send({
                ...loginResponse.body,
                firstName: 'UpdatedFirstName',
                lastName: 'UpdatedLastName'
            });

        expect(response.statusCode).toBe(404);
        expect(response.body.error).toBe('User not found!');
    });
});