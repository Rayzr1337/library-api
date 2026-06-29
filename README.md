# Library Management API

Simple library CRUD API. Handles books, users, and borrow/return workflows with role-based access control.

**Stack:** Node.js, Express, TypeScript, MongoDB

**Validation:** Zod

**Auth:** Session-based (express-session + connect-mongo, bcrypt password hashing)

**File Uploads (for cover images):** Multer

---

## Running locally

```bash
git clone https://github.com/Rayzr1337/library-api.git
cd library-api
npm install
```

Create a `.env` file:
```
PORT=
DB_URL=
SESSION_SECRET=
```

```bash
npm run dev
```

Multer upload directory: ```./uploads```

---

## Endpoints

All endpoints prefixed with `/api`. JSON bodies unless noted.

---

### Auth

```
POST /api/auth/signup
POST /api/auth/login
POST /api/auth/logout
```

**Signup body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "firstName": "string",
  "lastName": "string",
  "isAdmin": false
}
```

**Login body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**User response** (password never included):
```json
{
  "_id": "...",
  "username": "string",
  "email": "string",
  "firstName": "string",
  "lastName": "string",
  "isAdmin": false
}
```

---

### Books

```
GET    /api/books           public
GET    /api/books/:id       public
POST   /api/books           admin
PUT    /api/books/:id       admin
DELETE /api/books/:id       admin
```

`POST` and `PUT` accept `multipart/form-data` (cover is an image file upload):

| Field | Type | Required |
|-------|------|----------|
| name | text | yes |
| author | text | yes |
| category | text | yes |
| description | text | yes |
| cover | file (image) | yes (optional on PUT) |

Valid categories: `fantasy`, `dystopia`, `classic`, `science`, `history`, `self-help`, `psychology`, `technology`, `biography`, `philosophy`

**Book response:**
```json
{
  "id": "B-00001",
  "name": "string",
  "author": "string",
  "category": "string",
  "description": "string",
  "cover": "COVER-1234567890.jpg",
  "available": true
}
```

Cover images served at `/uploads/:filename`,

for example: http://localhost:PORT/uploads/COVER-filename.jpg

---

### Borrow

```
GET  /api/borrow              user — current user's borrow records
POST /api/borrow              user — borrow a book
POST /api/borrow/return/:id   user — return a book by book ID (e.g. B-00001)
GET  /api/borrow/recent       admin — recent borrow activity
```

**Borrow body:**
```json
{
  "bookId": "B-00001"
}
```

**Borrow record response:**
```json
{
  "_id": "...",
  "book": {
    "id": "B-00001",
    "name": "string",
    "author": "string",
    "cover": "COVER-1234567890.jpg",
    "available": false
  },
  "user": {
    "username": "string",
    "email": "string"
  },
  "borrowDate": "2026-01-01T00:00:00.000Z",
  "returnDate": null
}
```

`returnDate` is `null` if currently borrowed.

---

### Users

```
GET /api/user/me    user
PUT /api/user/me    user
```

`PUT` body — all fields required:
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "firstName": "string",
  "lastName": "string",
  "isAdmin": false
}
```

---

## Error responses

```json
{ "error": "message" }
```

Validation errors:
```json
{
  "errors": {
    "name": ["Required"],
    "cover": ["Invalid URL"]
  }
}
```

---

## Notes

- Books get sequential IDs (`B-00001`, `B-00002`, ...)
- Book availability flips automatically on borrow and return
- A user cannot borrow the same book twice while it's still borrowed
- Session auth -> login sets a cookie, logout destroys it

---

## Planned

- JWT auth with refresh tokens
- Pagination, filtering, sorting on list endpoints
- Rate limiting + security hardening (helmet, CORS, mongo sanitization)
- Cloudinary integration for book cover uploads
- Tests (Jest + Supertest)
- Dockerization


