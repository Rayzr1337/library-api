# Library Management API

Simple library CRUD API. Handles books, users, and borrow/return workflows with role-based access control.

**Stack:** Node.js, Express, TypeScript, MongoDB (Mongoose)

**Validation:** Zod

**Auth:** JWT (access + refresh tokens, bcrypt password hashing)

**OAuth2.0:** Google & GitHub with Passport.js

**File Uploads:** Multer

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
JWT_SECRET=
BASE_URL=
NODE_ENV= //'production' or 'development'

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

```bash
npm run dev
```

Multer upload directory: `./uploads`

---

## Authentication

JWT-based auth with a two-token system:

**Access token**: short-lived (15 min), signed with HS256, stored in an `httpOnly` cookie. Sent automatically on every request. Contains `userId` and `isAdmin` in the payload.

**Refresh token**: long-lived (3 days), stored in a separate `httpOnly` cookie. Used only to issue a new access token when the current one expires. The raw token is stored as a SHA256 hash in the MongoDB database

**Rotation** — every call to `/api/auth/refresh` invalidates the old refresh token and issues a new one. The new refresh token inherits the original expiry, so the 3-day window doesn't reset on each refresh.

**Logout** — clears both cookies and deletes the refresh token hash from the database. Works even if the access token is expired.

## **OAuth Login/Signup**
 ```
GET /api/auth/github
GET /api/auth/google
```
(Automatic redirection & JWT Token-setting afterwards.)

---

## Endpoints

All endpoints prefixed with `/api`. JSON bodies unless noted.

---

### Auth

```
POST /api/auth/signup
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
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
for example: `http://localhost:PORT/uploads/COVER-filename.jpg`

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
## Query Parameters

All list endpoints support pagination and sorting.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 10 | Items per page (max 100) |
| order | `asc` / `desc` | `asc` | Sort direction |

### Books
| Param | Type | Description |
|-------|------|-------------|
| category | enum | Filter by category |
| author | string | Filter by author |
| available | `true` / `false` | Filter by availability |
| sort | `name` / `author` / `category` / `createdAt` / `id` | Sort field |

### Borrows
| Param | Type | Description |
|-------|------|-------------|
| returned | `true` / `false` | Filter by return status |
| sort | `borrowDate` / `returnDate` | Sort field |

### Paginated response shape
```json
{
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalItems": 42,
    "totalPages": 5
  }
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
    "name": ["Required"]
  }
}
```

| Status | Meaning |
|--------|---------|
| 400 | Bad request / validation failed |
| 401 | Not authenticated |
| 403 | Not authorized |
| 404 | Not found |
| 409 | Conflict (duplicate) |
| 500 | Internal server error |

---

## Notes

- Books get sequential IDs (`B-00001`, `B-00002`, ...)
- Book availability flips automatically on borrow and return
- A user cannot borrow the same book twice while it is still borrowed
- Passwords are never returned in any response

---

## To-Do

- [x] JWT auth with refresh token rotation
- [x] Pagination & Limiting, filtering, sorting on list endpoints
- [x] Rate limiting + security headers with helmet 
- [ ] Cloudinary integration for book cover uploads
- [ ] Tests (Jest + Supertest)
- [ ] Docker Containerization


