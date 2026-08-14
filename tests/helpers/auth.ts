import request from 'supertest'
import User from '../../src/models/user'

const defaultUser = {
  username: 'testuser1',
  email: 'testuser1@example.com',
  password: 'password123',
  firstName: 'Test',
  lastName: 'User',
  isAdmin: false,
};

export async function signupUser(app: any, overrides = {}) {
  return request(app).post('/api/auth/signup').send({
    ...defaultUser,
    ...overrides,
  });
}

export async function loginUser(
  app: any,
  username = defaultUser.username,
  password = defaultUser.password,
) {
  return request(app).post('/api/auth/login').send({
    username,
    password,
  });
}

export async function createOAuthUser(overrides = {}) {
  return User.create({
    username: defaultUser.username,
    email: defaultUser.email,
    firstName: defaultUser.firstName,
    lastName: defaultUser.lastName,
    isAdmin: defaultUser.isAdmin,
    ...overrides,
  });
}
