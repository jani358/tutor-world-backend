# Tutor World Backend

A comprehensive backend API for the Tutor World quiz and learning management system.

## Features

- **User Authentication** (US-001, US-002, US-003, US-021, US-022)
  - Student and admin registration
  - Email verification with code
  - JWT-based authentication
  - Password reset functionality
  - Account management

- **Smart Quiz System** (US-004, US-005, US-006)
  - Randomized question selection
  - Difficulty-based question assignment
  - Quiz attempt tracking
  - Answer submission and grading

- **Student Dashboard** (US-007, US-008, US-009)
  - View assigned quizzes
  - Track progress overview
  - User-friendly interface

- **Instant Results** (US-010, US-011, US-012)
  - Immediate scoring after submission
  - Display correct answers
  - Detailed feedback and explanations

- **Progress Tracking** (US-013, US-014, US-015)
  - Visual charts and statistics
  - Subject-wise breakdown
  - Filterable by date range and quiz type
  - Performance trends

- **Admin Control Panel** (US-016, US-017, US-019, US-020, US-027, US-028)
  - Question bank management
  - Quiz creation and assignment
  - Student performance monitoring
  - Bulk student import via CSV
  - Account activation/deactivation

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Joi
- **Email**: Nodemailer
- **Logging**: Winston
- **Security**: bcrypt for password hashing

## Installation

1. **Clone the repository**
   ```bash
   cd tutor-world-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and configure:
   - MongoDB connection URL
   - JWT secrets
   - Email credentials (SMTP)
   - Frontend URL
   - Admin credentials

4. **Run in development**
   ```bash
   npm start
   ```
   This will watch TypeScript files and auto-restart the server.

5. **Build for production**
   ```bash
   npm run build
   npm run start:prod
   ```

## API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Register new student
- `POST /login` - Login user
- `POST /verify-email` - Verify email with code
- `POST /resend-verification` - Resend verification code
- `POST /forgot-password` - Request password reset
- `POST /reset-password` - Reset password
- `POST /refresh-token` - Refresh access token
- `POST /logout` - Logout user

### Quizzes (`/api/quizzes`) - Student Routes
- `GET /my-quizzes` - Get assigned quizzes
- `GET /:quizId/start` - Start a quiz
- `POST /:attemptId/submit` - Submit quiz answers
- `GET /results/:attemptId` - Get quiz result
- `GET /my-attempts` - Get all attempts

### Progress (`/api/progress`) - Student Routes
- `GET /` - Get progress overview
- `GET /statistics` - Get detailed statistics
- `GET /chart` - Get chart data with filters

### Admin (`/api/admin`) - Admin Routes

#### Questions
- `POST /questions` - Create question
- `GET /questions` - Get all questions
- `PUT /questions/:questionId` - Update question
- `DELETE /questions/:questionId` - Delete question

#### Quizzes
- `POST /quizzes` - Create quiz
- `GET /quizzes` - Get all quizzes
- `PUT /quizzes/:quizId` - Update quiz
- `POST /quizzes/:quizId/assign` - Assign to students
- `GET /quizzes/:quizId/results` - Get quiz results

#### Students
- `GET /students` - Get all students
- `PATCH /students/:userId/toggle-status` - Activate/deactivate
- `POST /students/import` - Import from CSV

## Database Models

### User
- Student and Admin roles
- Email verification
- Password reset tokens
- Profile information (grade, school, etc.)

### Question
- Multiple question types (multiple choice, true/false, short answer)
- Difficulty levels (easy, medium, hard)
- Subject and grade categorization
- Point values

### Quiz
- Question assignment
- Time limits
- Randomization options
- Student assignment
- Status management

### QuizAttempt
- Answer tracking
- Scoring and grading
- Time tracking
- Completion status

## CSV Import Format

For bulk student import (`/api/admin/students/import`):

```csv
email,firstName,lastName,grade,password
student1@example.com,John,Doe,Grade 5,password123
student2@example.com,Jane,Smith,Grade 6,password456
```

## Default Admin Account

On first run, a default admin account is created:
- **Email**: admin@tutorworld.com (or from `.env`)
- **Password**: Admin@123 (or from `.env`)

⚠️ **Change the default password after first login!**

## Development

The project uses:
- TypeScript for type safety
- Concurrent compilation and server restart
- Winston for logging (logs stored in `logs/` directory)
- Morgan for HTTP request logging

## Project Structure

```
src/
├── config/          # Configuration files
├── controllers/     # Request handlers
├── middlewares/     # Express middlewares
├── models/          # Database models
├── routes/          # API routes
├── services/        # Business logic
├── utils/           # Utility functions
├── validations/     # Request validation schemas
└── index.ts         # Application entry point
```

## Error Handling

All errors are handled centrally through the error handler middleware. Errors include:
- Validation errors (400)
- Authentication errors (401)
- Authorization errors (403)
- Not found errors (404)
- Server errors (500)

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Request validation
- CORS configuration
- Rate limiting support (configurable)

## License

MIT

## Support

For issues and questions, please contact the development team.
