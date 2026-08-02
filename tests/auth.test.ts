import './helpers/db'
import request from 'supertest'
import { createApp } from '../src/app'
import User from '../src/models/user'
import RefreshToken from '../src/models/refreshToken'

const app = createApp();

jest.mock('express-rate-limit', () => {
  return jest.fn(() => (req: any, res: any, next: any) => next());
});

jest.mock('passport', () => ({
  use: jest.fn(),
  initialize: jest.fn(() => (req: any, res: any, next: any) => next()),
  session: jest.fn(() => (req: any, res: any, next: any) => next()),
  authenticate: (strategy: string, options?: any) => {
    return (req: any, res: any, next: any) => {
      if (req.headers['x-mock-oauth'] === 'fail') {
        return res.redirect(options.failureRedirect);
      }
      if (options === undefined) {
        return res.redirect(`https://mock-${strategy}.example.com/oauth/authorize`);
      }
      req.user = { userId: '507f1f77bcf86cd799439011', isAdmin: false };
      next();
    };
  },
}));

describe("Testing the sign-up route.", () => {
    it("Valid input returns 201 with created user, sets tokens.", async () => {
        const res = await request(app).post('/api/auth/signup').send({
          username: 'testuser1',
          email: 'testuser1@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
          isAdmin: false,
        });

        expect(res.statusCode).toBe(201);
        expect(res.body).toMatchObject({
          username: 'testuser1',
          email: 'testuser1@example.com',
          firstName: 'Test',
          lastName: 'User',
          isAdmin: false
        });

        expect(res.body).not.toHaveProperty('password');
        expect(res.body._id).toBeDefined();
       
        const rawCookies = res.headers['set-cookie'];
        expect(Array.isArray(rawCookies)).toBe(true);
        const cookies = rawCookies as unknown as string[];

        expect(cookies).toBeDefined();
        expect(cookies.some(c => /^token=[^;]+/.test(c))).toBe(true);
        expect(cookies.some(c => /^rToken=[^;]+/.test(c))).toBe(true);
    })

    it("Invalid input returns 400 with Zod errors.", async () => {
        const res = await request(app).post('/api/auth/signup').send({
          username: 'testuser2',
          email: 'not-an-email',
          password: 'short',
          firstName: 'Test',
          lastName: 'User',
          isAdmin: false,
        });

        expect(res.statusCode).toBe(400);
        expect(res.body.errors).toBeDefined();

        expect(res.body.errors).toHaveProperty('email');
        expect(res.body.errors).toHaveProperty('password');
    })

    it("Used username returns 409.", async () => {
        await User.create({
          username: 'testuser1',
          email: 'testuser1@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
          isAdmin: false,
        });

        const res = await request(app).post('/api/auth/signup').send({
          username: 'testuser1',
          email: 'differentemail@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
          isAdmin: false,
        });

        expect(res.statusCode).toBe(409);
        expect(res.body.error).toBe('Username already in use!');
    })

    it("Used email returns 409.", async () => {
        await User.create({
          username: 'testuser1',
          email: 'testuser1@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
          isAdmin: false,
        });

        const res = await request(app).post('/api/auth/signup').send({
          username: 'testuser2',
          email: 'testuser1@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
          isAdmin: false,
        });

        expect(res.statusCode).toBe(409);
        expect(res.body.error).toBe('Email already in use!');
    })
});

describe("Testing the login route.", () => {
    it("Valid input returns 200 and sets tokens.", async () => {
        await request(app).post('/api/auth/signup').send({
                  username: 'testuser1',
                  email: 'testuser1@example.com',
                  password: 'password123',
                  firstName: 'Test',
                  lastName: 'User',
                  isAdmin: false,
         });

        const res = await request(app).post('/api/auth/login').send({
            username: 'testuser1',
            password: 'password123'
        });

        expect(res.statusCode).toBe(200);
        expect(res.body).toMatchObject({
                  username: 'testuser1',
                  email: 'testuser1@example.com',
                  firstName: 'Test',
                  lastName: 'User',
                  isAdmin: false,
                });

        expect(res.body).not.toHaveProperty('password');
        expect(res.body._id).toBeDefined();
       
        const rawCookies = res.headers['set-cookie'];
        expect(Array.isArray(rawCookies)).toBe(true);
        const cookies = rawCookies as unknown as string[];

        expect(cookies).toBeDefined();
        expect(cookies.some(c => /^token=[^;]+/.test(c))).toBe(true);
        expect(cookies.some(c => /^rToken=[^;]+/.test(c))).toBe(true);
    })

    it("Invalid input returns 400 with Zod errors.", async () => {
        const res = await request(app).post('/api/auth/login').send({
          username: '',
          password: 'short',
        });

        expect(res.statusCode).toBe(400);
        expect(res.body.errors).toBeDefined();

        expect(res.body.errors).toHaveProperty('username');
        expect(res.body.errors).toHaveProperty('password');
    })

    it("Wrong password returns 401.", async () => {
        await request(app).post('/api/auth/signup').send({
                  username: 'testuser1',
                  email: 'testuser1@example.com',
                  password: 'password123',
                  firstName: 'Test',
                  lastName: 'User',
                  isAdmin: false,
        });

        const res = await request(app).post('/api/auth/login').send({
            username: 'testuser1',
            password: 'wrongpassword123'
        });

        expect(res.statusCode).toBe(401);
        expect(res.body.error).toBe('Invalid credentials!');
    })

    it("Non-existent username returns 401.", async () => {
        const res = await request(app).post('/api/auth/login').send({
            username: 'doesnotexist',
            password: 'wrongpassword123'
        });

        expect(res.statusCode).toBe(401);
        expect(res.body.error).toBe('Invalid credentials!');
    })

    it("Username with no DB password returns 401 with informing OAuth account existence.", async () => {
        await User.create({
          username: 'testuser1',
          email: 'testuser1@example.com',
          firstName: 'Test',
          lastName: 'User',
          isAdmin: false,
        });
        
        const res = await request(app).post('/api/auth/login').send({
            username: 'testuser1',
            password: 'passwordthatdoesntmatter'
        });

        expect(res.statusCode).toBe(401);
        expect(res.body.error).toBe('Account registered via OAuth - use Google/GitHub to log in.');
    })
});

describe("Testing the logout route.", () => {
    it("Valid session logout returns 200, clears tokens.", async () => {
        await request(app).post('/api/auth/signup').send({
            username: 'testuser1',
            email: 'testuser1@example.com',
            password: 'password123',
            firstName: 'Test',
            lastName: 'User',
            isAdmin: false,
        });

        const loginRes = await request(app).post('/api/auth/login').send({
            username: 'testuser1',
            password: 'password123',
        });

        const rawCookies = loginRes.headers['set-cookie'] as unknown as string[];
        const res = await request(app).post('/api/auth/logout').set('Cookie', rawCookies);
        
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Logged out successfully.');

        const cookies = res.headers['set-cookie'] as unknown as string[];

        const tokenCookie = cookies.find(c => c.startsWith('token='));
        const rTokenCookie = cookies.find(c => c.startsWith('rToken='));

        expect(tokenCookie).toContain('Expires=Thu, 01 Jan 1970');
        expect(rTokenCookie).toContain('Expires=Thu, 01 Jan 1970');

        const findRefresh = await RefreshToken.findOne({ user: loginRes.body._id });
        expect(findRefresh).toBeNull();
    })

    it("Inactive session logout returns 401.", async () => {
        const res = await request(app).post('/api/auth/logout'); 

        expect(res.statusCode).toBe(401);
        expect(res.body.error).toBe('Not logged in.');
    })
});

describe("Testing the refresh route.", () => {
    it("Valid refresh token returns 200, sets new access token.", async () => {
        await request(app).post('/api/auth/signup').send({
            username: 'testuser1',
            email: 'testuser1@example.com',
            password: 'password123',
            firstName: 'Test',
            lastName: 'User',
            isAdmin: false,
        });

        const loginRes = await request(app).post('/api/auth/login').send({
            username: 'testuser1',
            password: 'password123',
        });

        const oldCookies = loginRes.headers['set-cookie'] as unknown as string[];
        const res = await request(app).post('/api/auth/refresh').set('Cookie', oldCookies);

        const oldRToken = oldCookies.find(c => c.startsWith('rToken='));

        const newCookies = res.headers['set-cookie'] as unknown as string[];
        expect(newCookies).toBeDefined();
        expect(newCookies.some(c => /^token=[^;]+/.test(c))).toBe(true);
        expect(newCookies.some(c => /^rToken=[^;]+/.test(c))).toBe(true);

        const newRToken = newCookies.find(c => c.startsWith('rToken='));

        expect(oldRToken).not.toBe(newRToken);
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Access token refreshed.');
    })

    it("Non-present refresh token returns 400.", async () => {
        const res = await request(app).post('/api/auth/refresh');

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe('No refresh token found.');
    })

    it("User no longer existent in DB returns 404.", async () => {
        await request(app).post('/api/auth/signup').send({
            username: 'testuser1',
            email: 'testuser1@example.com',
            password: 'password123',
            firstName: 'Test',
            lastName: 'User',
            isAdmin: false,
        });

        const loginRes = await request(app).post('/api/auth/login').send({
            username: 'testuser1',
            password: 'password123',
        });

        const oldCookies = loginRes.headers['set-cookie'] as unknown as string[];

        await User.findOneAndDelete({ username: 'testuser1' })
        const res = await request(app).post('/api/auth/refresh').set('Cookie', oldCookies);
        
        expect(res.statusCode).toBe(404);
        expect(res.body.error).toBe('User no longer exists!');
    })

    it("Invalid/Expired refresh token returns 401.", async () => {
        const res = await request(app)
          .post('/api/auth/refresh')
          .set('Cookie', ['rToken=this.is.not.a.real.jwt']);

        expect(res.statusCode).toBe(401);
        expect(res.body.error).toBe('Invalid/Expired refresh token.');
    })

    it("Reusing a rotated/invalid refresh token returns 401.", async () => {
      await request(app).post('/api/auth/signup').send({
        username: 'testuser1',
        email: 'testuser1@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        isAdmin: false,
      });
      const loginRes = await request(app).post('/api/auth/login').send({
        username: 'testuser1',
        password: 'password123',
      });
      const originalCookies = loginRes.headers['set-cookie'] as unknown as string[];

      await request(app).post('/api/auth/refresh').set('Cookie', originalCookies);
      const res = await request(app).post('/api/auth/refresh').set('Cookie', originalCookies);

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('Invalid/Expired refresh token.');
    })
});

describe("Testing the OAuth routes.", () => {
    it("GET /auth/google returns 302 with proper redirection.", async () => {
        const res = await request(app).get('/api/auth/google'); 

        expect(res.statusCode).toBe(302);
        expect(res.headers.location).toBe('https://mock-google.example.com/oauth/authorize');
    })

    it("GET /auth/github returns 302 with proper redirection.", async () => {
        const res = await request(app).get('/api/auth/github'); 

        expect(res.statusCode).toBe(302);
        expect(res.headers.location).toBe('https://mock-github.example.com/oauth/authorize');
    })

    it("Callbacks return 200 and set tokens.", async () => {
        const res = await request(app).get('/api/auth/github/callback');
        console.log(res.body);

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('OAuth login successful with external service.');

        const rawCookies = res.headers['set-cookie'] as unknown as string[];
        expect(Array.isArray(rawCookies)).toBe(true);

        expect(rawCookies.some(c => /^token=[^;]+/.test(c))).toBe(true);
        expect(rawCookies.some(c => /^rToken=[^;]+/.test(c))).toBe(true);
    })

    it("GET /auth/google/callback on failure redirects to /auth/failure.", async () => {
        const res = await request(app).get('/api/auth/google/callback').set('x-mock-oauth', 'fail');

        expect(res.statusCode).toBe(302);
        expect(res.headers.location).toBe('/api/auth/failure');
    });

    it("GET /auth/failure returns 401.", async () => {
       const res = await request(app).get('/api/auth/failure');

       expect(res.statusCode).toBe(401);
       expect(res.body.error).toBe('OAuth authentication failed');
    });
});
