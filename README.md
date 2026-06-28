# Library Mangagement API

Simple library CRUD API. Handles books, users, and borrow/return workflows with with role-based control.

Stack: Node.js, Express, TypeScript, MongoDB.

Validation: Zod

Auth: Session auth (express-session + connect-mongo, password hashing with bcrypt)

---

## Running locally

```bash
git clone https://github.com/Rayzr1337/library-api.git
cd library-api
npm install
```

create a `.env` file:
```
PORT=
DB_URL=
SESSION_SECRET=
```

run:
```bash
npm run dev
```

---

## Endpoints

All endpoints are prefixed with `/api`. Bodies are JSON.

### Auth
```
POST /api/auth/signup
POST /api/auth/login
POST /api/auth/logout
```

### Books
```
GET    /api/books
GET    /api/books/:id
POST   /api/books        (admin)
PUT    /api/books/:id    (admin)
DELETE /api/books/:id    (admin)
```

### Borrow
```
GET  /api/borrow                  (current user's records)
POST /api/borrow                  (borrow a book)
POST /api/borrow/return/:id       (return a book)
GET  /api/borrow/recent           (admin)
```

### Users
```
GET /api/user/me
PUT /api/user/me
```

---

## Notes

- Books get sequential IDs (`B-00001`, `B-00002`, ...) 
- Book availability updates automatically on borrow or return
- Session-based auth -> login sets cookie and logout destroys it

---

## Planned

- JWT auth
- Pagination, filtering, sorting
- Rate limiting + security hardening (helmet, CORS)
- Image uploads for book covers
- Tests (Jest + Supertest)


