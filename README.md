# Tutor World Backend

**Production-ready backend API for the Tutor World quiz and learning management platform.**
Built with Node.js, TypeScript, Express.js, and MongoDB.

---

## Tech Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Auth**: JWT (HS512) — access token 24h, refresh token 7d
- **Password**: bcrypt (12 rounds)
- **Email**: Nodemailer (SMTP / Gmail)
- **Validation**: Joi
- **Logging**: Winston

---

## Roles

| Role      | Access                                          |
|-----------|-------------------------------------------------|
| `student` | Take quizzes, view progress, manage own account |
| `teacher` | Manage questions, quizzes, view student results |
| `admin`   | Full platform management                        |

---

## Quick Start

```bash
npm install
cp .env.example .env  # fill in your values
npm run dev
```

Server runs on `http://localhost:5001`.

---

## Environment Variables

```env
PORT=5001
NODE_ENV=development

MONGODB_URI=mongodb://localhost:27017/tutor-world

JWT_SECRET=<your-secret>
JWT_REFRESH_SECRET=<your-refresh-secret>
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=7d

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@tutorworld.com

FRONTEND_URL=http://localhost:3000

ADMIN_EMAIL=admin@tutorworld.com
ADMIN_PASSWORD=Admin@123
```

---

## API Reference

### Base URL
```
http://localhost:5001/api
```

### Auth Header (protected routes)
```
Authorization: Bearer <access-token>
```

---

### Authentication — `/api/auth`

| Method | Endpoint                 | Description                                      | Auth |
|--------|--------------------------|--------------------------------------------------|------|
| POST   | `/register`              | Register new student account                     | No   |
| POST   | `/login`                 | Login with email + password                      | No   |
| POST   | `/google/callback`       | Exchange Google id_token for app JWT tokens      | No   |
| POST   | `/verify-email`          | Verify email with 6-digit code                   | No   |
| POST   | `/resend-verification`   | Resend verification email                        | No   |
| POST   | `/forgot-password`       | Request password reset email                     | No   |
| POST   | `/reset-password`        | Reset password with token                        | No   |
| POST   | `/refresh-token`         | Rotate refresh → new access + refresh tokens     | No   |
| POST   | `/logout`                | Confirm logout (JWT revocation is client-side)   | No   |

#### Register
```json
POST /api/auth/register
{
  "email": "student@example.com",
  "password": "Password123",
  "firstName": "John",
  "lastName": "Doe",
  "username": "johndoe",       // optional — auto-derived if omitted
  "grade": "Grade 5",          // optional
  "school": "Example School"   // optional
}
```

Response `201`:
```json
{
  "status": "success",
  "message": "Registration successful. Please check your email for your verification code.",
  "data": { "userId": "...", "username": "johndoe", "email": "...", "role": "student" }
}
```

#### Login
```json
POST /api/auth/login
{ "email": "student@example.com", "password": "Password123" }
```

Response `200`:
```json
{
  "status": "success",
  "data": {
    "user": { "userId": "...", "username": "...", "email": "...", "firstName": "...", "lastName": "...", "role": "student" },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

#### Google OAuth Callback
Called by NextAuth after Google verifies the user. Auto-registers first-time Google users.
```json
POST /api/auth/google/callback
{ "idToken": "<Google id_token from NextAuth>" }
```

Response `200`: Same shape as login response.

#### Refresh Token
Returns both a new access token **and** a rotated refresh token.
```json
POST /api/auth/refresh-token
{ "refreshToken": "eyJ..." }
```

Response `200`:
```json
{ "status": "success", "data": { "accessToken": "eyJ...", "refreshToken": "eyJ..." } }
```

---

### Quizzes — `/api/quizzes`

| Method | Endpoint                    | Description                  | Role    |
|--------|-----------------------------|------------------------------|---------|
| GET    | `/my-quizzes`               | Get assigned quizzes          | student |
| GET    | `/:quizId/start`            | Start a quiz (get questions)  | student |
| POST   | `/:attemptId/submit`        | Submit quiz answers           | student |
| GET    | `/results/:attemptId`       | View attempt result           | student |
| GET    | `/my-attempts`              | Quiz history                  | student |

---

### Progress — `/api/progress`

| Method | Endpoint         | Description                   | Role    |
|--------|------------------|-------------------------------|---------|
| GET    | `/`              | Progress overview             | student |
| GET    | `/statistics`    | Detailed statistics            | student |
| GET    | `/chart`         | Chart data (date range)       | student |

---

### Admin — `/api/admin`

| Method | Endpoint                          | Description                     | Role  |
|--------|-----------------------------------|---------------------------------|-------|
| GET    | `/questions`                      | List all questions (filterable) | admin |
| POST   | `/questions`                      | Create question                 | admin |
| PUT    | `/questions/:questionId`          | Update question                 | admin |
| DELETE | `/questions/:questionId`          | Delete question                 | admin |
| GET    | `/quizzes`                        | List all quizzes                | admin |
| POST   | `/quizzes`                        | Create quiz                     | admin |
| PUT    | `/quizzes/:quizId`                | Update quiz                     | admin |
| POST   | `/quizzes/:quizId/assign`         | Assign quiz to students         | admin |
| GET    | `/quizzes/:quizId/results`        | View all results for a quiz     | admin |
| GET    | `/students`                       | List all students               | admin |
| PATCH  | `/students/:userId/toggle-status` | Activate / deactivate student   | admin |
| POST   | `/students/import`                | Bulk import from CSV            | admin |

---

## Data Models

### User

| Field                  | Type     | Notes                                     |
|------------------------|----------|-------------------------------------------|
| `userId`               | String   | UUID, unique index                        |
| `username`             | String   | Unique, lowercase, 3–30 chars             |
| `email`                | String   | Unique, lowercase                         |
| `password`             | String   | bcrypt-hashed, not selected by default    |
| `firstName`            | String   | —                                         |
| `lastName`             | String   | —                                         |
| `role`                 | Enum     | `student` \| `teacher` \| `admin`         |
| `isEmailVerified`      | Boolean  | Must be true to login                     |
| `isActive`             | Boolean  | Can be toggled by admin                   |
| `googleId`             | String   | Set for Google OAuth users                |
| `avatar`               | String   | Profile picture URL (Google OAuth)        |
| `grade`                | String   | Optional — student's grade level          |
| `school`               | String   | Optional — student's school name          |
| `verificationCode`     | String   | 6-digit code, not selected by default     |
| `resetPasswordToken`   | String   | JWT token, not selected by default        |

### Question, Quiz, QuizAttempt

See `src/models/` for full Mongoose schemas.

---

## File Structure

```
src/
├── config/           — CORS, database config
├── constants/        — Grades, subjects, difficulty levels
├── controllers/      — Request handlers (thin layer)
├── middlewares/      — authenticate, isAdmin, isTeacher, isStudent, validate, errorHandler
├── models/           — User, Question, Quiz, QuizAttempt schemas
├── routes/           — Express routers
├── services/         — Business logic
├── types/            — TypeScript interfaces
├── utils/            — JWT, email, logger, seedAdmin
└── validations/      — Joi schemas
```

---

## Seeded Admin

On first start, a default admin is created:
- **Email**: `ADMIN_EMAIL` env var (default: `admin@tutorworld.com`)
- **Password**: `ADMIN_PASSWORD` env var (default: `Admin@123`)

Change these credentials after first login.

---

## Scripts

```bash
npm run dev         # ts-node dev server
npm run build       # compile TypeScript
npm run start       # run compiled JS (production)
```
