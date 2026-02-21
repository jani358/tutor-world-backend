# API Documentation

## Base URL
```
http://localhost:5001/api
```

## Authentication

All protected routes require a Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## 1. Authentication Endpoints

### 1.1 Register (US-021)
**POST** `/auth/register`

Register a new student account.

**Request Body:**
```json
{
  "email": "student@example.com",
  "password": "Password123",
  "firstName": "John",
  "lastName": "Doe",
  "grade": "Grade 5",
  "school": "Example School",
  "dateOfBirth": "2010-01-15"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Registration successful. Please check your email for verification code.",
  "data": {
    "userId": "uuid",
    "email": "student@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "student"
  }
}
```

---

### 1.2 Verify Email (US-022)
**POST** `/auth/verify-email`

Verify email with the code sent to user's email.

**Request Body:**
```json
{
  "email": "student@example.com",
  "code": "123456"
}
```

---

### 1.3 Login (US-001, US-002)
**POST** `/auth/login`

Login for both students and admins.

**Request Body:**
```json
{
  "email": "student@example.com",
  "password": "Password123"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "user": {
      "userId": "uuid",
      "email": "student@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "student",
      "grade": "Grade 5"
    },
    "accessToken": "jwt-access-token",
    "refreshToken": "jwt-refresh-token"
  }
}
```

---

### 1.4 Logout (US-003)
**POST** `/auth/logout`

Logout user (client-side token removal).

---

### 1.5 Forgot Password
**POST** `/auth/forgot-password`

Request password reset link.

**Request Body:**
```json
{
  "email": "student@example.com"
}
```

---

### 1.6 Reset Password
**POST** `/auth/reset-password`

Reset password with token.

**Request Body:**
```json
{
  "token": "reset-token-from-email",
  "newPassword": "NewPassword123"
}
```

---

## 2. Student Quiz Endpoints

### 2.1 Get My Quizzes (US-007)
**GET** `/quizzes/my-quizzes`

Get all quizzes assigned to the logged-in student.

**Headers:** 
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "quizId": "uuid",
      "title": "Math Quiz 1",
      "subject": "Mathematics",
      "grade": "Grade 5",
      "totalPoints": 100,
      "passingScore": 60,
      "timeLimit": 30,
      "attemptCount": 2,
      "lastAttempt": {
        "score": 85,
        "percentage": 85,
        "isPassed": true,
        "completedAt": "2024-01-15T10:30:00Z"
      }
    }
  ]
}
```

---

### 2.2 Start Quiz (US-004)
**GET** `/quizzes/:quizId/start`

Start a quiz and get questions.

**Response:**
```json
{
  "status": "success",
  "data": {
    "attempt": {
      "attemptId": "uuid",
      "quizId": "uuid",
      "status": "in_progress",
      "startedAt": "2024-01-15T10:00:00Z"
    },
    "quiz": {
      "title": "Math Quiz 1",
      "subject": "Mathematics",
      "timeLimit": 30,
      "questions": [
        {
          "_id": "question-id",
          "title": "What is 2 + 2?",
          "questionType": "multiple_choice",
          "options": [
            { "text": "3" },
            { "text": "4" },
            { "text": "5" }
          ],
          "points": 10
        }
      ]
    }
  }
}
```

---

### 2.3 Submit Quiz (US-006, US-010, US-011)
**POST** `/quizzes/:attemptId/submit`

Submit quiz answers and get instant results.

**Request Body:**
```json
{
  "answers": [
    {
      "questionId": "question-uuid",
      "selectedAnswer": "4"
    }
  ]
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Quiz submitted successfully",
  "data": {
    "attemptId": "uuid",
    "score": 85,
    "percentage": 85,
    "isPassed": true,
    "completedAt": "2024-01-15T10:30:00Z",
    "answers": [
      {
        "questionId": {
          "title": "What is 2 + 2?",
          "options": [
            { "text": "4", "isCorrect": true }
          ],
          "explanation": "2 + 2 equals 4"
        },
        "selectedAnswer": "4",
        "isCorrect": true,
        "pointsEarned": 10
      }
    ]
  }
}
```

---

### 2.4 Get Quiz Result (US-012)
**GET** `/quizzes/results/:attemptId`

Get detailed quiz result for printing/downloading.

---

### 2.5 Get My Attempts (US-013)
**GET** `/quizzes/my-attempts`

Get all quiz attempts history.

---

## 3. Progress Tracking Endpoints

### 3.1 Get Progress Overview (US-009, US-013)
**GET** `/progress`

Get student progress overview.

**Response:**
```json
{
  "status": "success",
  "data": {
    "overview": {
      "totalQuizzes": 10,
      "averageScore": 82.5,
      "passRate": 90,
      "passedQuizzes": 9,
      "failedQuizzes": 1
    },
    "subjectBreakdown": [
      {
        "subject": "Mathematics",
        "attempts": 5,
        "averageScore": 85,
        "passRate": 100
      }
    ]
  }
}
```

---

### 3.2 Get Statistics (US-014)
**GET** `/progress/statistics`

Get detailed performance statistics.

---

### 3.3 Get Progress Chart (US-015)
**GET** `/progress/chart?startDate=2024-01-01&endDate=2024-02-01&subject=Mathematics`

Get chart data with filters.

**Query Parameters:**
- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date
- `subject` (optional): Filter by subject

**Response:**
```json
{
  "status": "success",
  "data": {
    "chartData": [
      {
        "date": "2024-01-15T10:30:00Z",
        "score": 85,
        "percentage": 85,
        "quizTitle": "Math Quiz 1",
        "subject": "Mathematics",
        "isPassed": true
      }
    ],
    "trend": "improving",
    "summary": {
      "totalAttempts": 10,
      "averagePercentage": 82.5
    }
  }
}
```

---

## 4. Admin Endpoints

All admin endpoints require admin role.

### 4.1 Question Management

#### Create Question (US-016)
**POST** `/admin/questions`

**Request Body:**
```json
{
  "title": "What is 2 + 2?",
  "description": "Basic addition",
  "questionType": "multiple_choice",
  "difficulty": "easy",
  "subject": "Mathematics",
  "grade": "Grade 5",
  "options": [
    { "text": "3", "isCorrect": false },
    { "text": "4", "isCorrect": true },
    { "text": "5", "isCorrect": false }
  ],
  "explanation": "2 + 2 equals 4",
  "points": 10,
  "tags": ["addition", "basic"]
}
```

---

#### Get Questions
**GET** `/admin/questions?subject=Mathematics&grade=Grade%205&page=1&limit=20`

---

#### Update Question (US-017)
**PUT** `/admin/questions/:questionId`

---

#### Delete Question
**DELETE** `/admin/questions/:questionId`

---

### 4.2 Quiz Management

#### Create Quiz
**POST** `/admin/quizzes`

**Request Body:**
```json
{
  "title": "Math Quiz 1",
  "description": "Basic mathematics quiz",
  "subject": "Mathematics",
  "grade": "Grade 5",
  "timeLimit": 30,
  "passingScore": 60,
  "questions": ["question-id-1", "question-id-2"],
  "isRandomized": true,
  "numberOfQuestions": 10,
  "status": "active"
}
```

---

#### Assign Quiz (US-020)
**POST** `/admin/quizzes/:quizId/assign`

**Request Body:**
```json
{
  "studentIds": ["student-user-id-1", "student-user-id-2"]
}
```

Sends email notifications to assigned students.

---

#### Get Quiz Results (US-019)
**GET** `/admin/quizzes/:quizId/results`

View all student results for a quiz.

---

### 4.3 Student Management

#### Get Students
**GET** `/admin/students?grade=Grade%205&page=1&limit=20`

---

#### Toggle Student Status (US-027)
**PATCH** `/admin/students/:userId/toggle-status`

**Request Body:**
```json
{
  "isActive": false
}
```

Activate or deactivate student account.

---

#### Import Students (US-028)
**POST** `/admin/students/import`

**Content-Type:** `multipart/form-data`

**Form Data:**
- `file`: CSV file

**CSV Format:**
```csv
email,firstName,lastName,grade,password
student1@example.com,John,Doe,Grade 5,password123
student2@example.com,Jane,Smith,Grade 6,password456
```

**Response:**
```json
{
  "status": "success",
  "message": "Students imported",
  "data": {
    "success": 2,
    "failed": 0,
    "errors": []
  }
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "status": "error",
  "message": "Error message here"
}
```

Common HTTP status codes:
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Testing with cURL

### Register
```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "Password123",
    "firstName": "John",
    "lastName": "Doe",
    "grade": "Grade 5"
  }'
```

### Login
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@tutorworld.com",
    "password": "Admin@123"
  }'
```

### Get My Quizzes (with token)
```bash
curl -X GET http://localhost:5001/api/quizzes/my-quizzes \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```
