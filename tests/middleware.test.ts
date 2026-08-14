import jwt from 'jsonwebtoken'

let isUser: typeof import('../src/middleware/auth').isUser
let isAdmin: typeof import('../src/middleware/auth').isAdmin

describe('isUser middleware', () => {
  const originalSecret = process.env.JWT_SECRET

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret'
    jest.resetModules();
    ({ isUser } = require('../src/middleware/auth'))
  })

  afterAll(() => {
    process.env.JWT_SECRET = originalSecret
  })

  it('calls next and sets req.user for a valid token', () => {
    const token = jwt.sign({ userId: '123', isAdmin: false }, 'test-secret')
    const req: any = { cookies: { token } }
    const res: any = {}
    const next = jest.fn()

    isUser(req, res, next)

    expect(next).toHaveBeenCalledWith()
    expect(req.user).toEqual({ userId: '123', isAdmin: false, iat: expect.any(Number) })
  })

  it('calls next(err) with 401 and Not logged in. when no token cookie exists', () => {
    const req: any = { cookies: {} }
    const res: any = {}
    const next = jest.fn()

    isUser(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.any(Error))
    const err = next.mock.calls[0][0] as Error & { statusCode?: number }
    expect(err.statusCode).toBe(401)
    expect(err.message).toBe('Not logged in.')
  })

  it('calls next(err) with 401 and Invalid or expired token! for an invalid token', () => {
    const req: any = { cookies: { token: 'bad-token' } }
    const res: any = {}
    const next = jest.fn()

    isUser(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.any(Error))
    const err = next.mock.calls[0][0] as Error & { statusCode?: number }
    expect(err.statusCode).toBe(401)
    expect(err.message).toBe('Invalid or expired token!')
  })
})

describe('isAdmin middleware', () => {
  beforeEach(() => {
    jest.resetModules();
    ({ isAdmin } = require('../src/middleware/auth'))
  })

  it('calls next() when req.user.isAdmin is true', () => {
    const req: any = { user: { isAdmin: true } }
    const res: any = {}
    const next = jest.fn()

    isAdmin(req, res, next)

    expect(next).toHaveBeenCalledWith()
  })

  it('calls next(err) with 403 and the admin error when req.user.isAdmin is false', () => {
    const req: any = { user: { isAdmin: false } }
    const res: any = {}
    const next = jest.fn()

    isAdmin(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.any(Error))
    const err = next.mock.calls[0][0] as Error & { statusCode?: number }
    expect(err.statusCode).toBe(403)
    expect(err.message).toBe('Action unauthorized: not logged in as an admin.')
  })

  it('calls next(err) with 403 and the admin error when req.user is missing', () => {
    const req: any = {}
    const res: any = {}
    const next = jest.fn()

    isAdmin(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.any(Error))
    const err = next.mock.calls[0][0] as Error & { statusCode?: number }
    expect(err.statusCode).toBe(403)
    expect(err.message).toBe('Action unauthorized: not logged in as an admin.')
  })
})

describe('error handler middleware', () => {
  it('sends a 400 response for a CastError', () => {
    const req: any = {}
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() }
    const next = jest.fn()

    const { globalErrorHandler } = require('../src/middleware/errorHandler')
    globalErrorHandler({ name: 'CastError' }, req, res, next)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid ID format' })
  })

  it('sends a 409 response for a duplicate key error', () => {
    const req: any = {}
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() }
    const next = jest.fn()

    const { globalErrorHandler } = require('../src/middleware/errorHandler')
    globalErrorHandler({ code: 11000 }, req, res, next)

    expect(res.status).toHaveBeenCalledWith(409)
    expect(res.json).toHaveBeenCalledWith({ error: 'Duplicate entry' })
  })
})

describe('upload middleware', () => {
  it('calls next without a file', async () => {
    const req: any = {}
    const res: any = {}
    const next = jest.fn()

    const { cloudinaryUpload } = require('../src/middleware/upload')
    await cloudinaryUpload(req, res, next)

    expect(next).toHaveBeenCalledWith()
  })
})

describe('validation middleware', () => {
  it('passes valid body through and sets req.body', () => {
    const { validate } = require('../src/middleware/validate')
    const schema = { safeParse: jest.fn(() => ({ success: true, data: { name: 'ok' } })) }
    const req: any = { body: { name: 'ok' } }
    const res: any = {}
    const next = jest.fn()

    validate(schema as any)(req, res, next)

    expect(req.body).toEqual({ name: 'ok' })
    expect(next).toHaveBeenCalledWith()
  })

  it('throws when validation fails', () => {
    const { validate } = require('../src/middleware/validate')
    const schema = { safeParse: jest.fn(() => ({ success: false, error: { flatten: () => ({ fieldErrors: { name: ['required'] } }) } })) }
    const req: any = { body: {} }
    const res: any = {}
    const next = jest.fn()

    expect(() => validate(schema as any)(req, res, next)).toThrow()
  })
})
