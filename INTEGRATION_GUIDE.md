# Frontend Integration Guide

This guide will help you integrate the tutor-world-frontend with the tutor-world-backend.

## Prerequisites

- Node.js installed
- MongoDB running locally or remote connection ready
- Backend server running on `http://localhost:5001`
- Frontend running on `http://localhost:3000`

---

## Backend Setup

### 1. Install Dependencies

```bash
cd tutor-world-backend
npm install
```

### 2. Configure Environment

The `.env` file is already created with default values. Update as needed:

```env
PORT=5001
MONGODB_URI=mongodb://localhost:27017/tutor-world
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:3000
```

### 3. Start the Server

```bash
# Development mode (with auto-reload)
npm start

# Production mode
npm run build
npm run start:prod
```

The server will start on `http://localhost:5001`

### 4. Default Admin Account

Default admin credentials:
- **Email**: `admin@tutorworld.com`
- **Password**: `Admin@123`

⚠️ Change the password after first login!

---

## Frontend Integration

### Update API Base URL

In your frontend project (`tutor-world-frontend`), update the API base URL:

**File**: `src/lib/api/config.ts` (create if doesn't exist)

```typescript
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
```

### Create API Client

**File**: `src/lib/api/client.ts`

```typescript
import axios from 'axios';
import { API_BASE_URL } from './config';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, try to refresh
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
            refreshToken,
          });
          const { accessToken } = response.data.data;
          localStorage.setItem('accessToken', accessToken);
          
          // Retry the original request
          error.config.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient.request(error.config);
        } catch (refreshError) {
          // Refresh failed, logout
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/auth';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

---

## Update Auth Actions

**File**: `src/lib/actions/auth.actions.ts`

```typescript
'use server'

import apiClient from '../api/client';

export async function registerAction(formData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  grade?: string;
  school?: string;
}) {
  try {
    const response = await apiClient.post('/auth/register', formData);
    return {
      success: true,
      message: response.data.message,
      data: response.data.data,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || 'Registration failed',
    };
  }
}

export async function loginAction(formData: {
  email: string;
  password: string;
}) {
  try {
    const response = await apiClient.post('/auth/login', formData);
    
    // Store tokens in localStorage (client-side only)
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', response.data.data.accessToken);
      localStorage.setItem('refreshToken', response.data.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    
    return {
      success: true,
      message: 'Login successful',
      data: response.data.data,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || 'Login failed',
    };
  }
}

export async function verifyEmailAction(email: string, code: string) {
  try {
    const response = await apiClient.post('/auth/verify-email', {
      email,
      code,
    });
    return {
      success: true,
      message: response.data.message,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || 'Verification failed',
    };
  }
}

export async function logoutAction() {
  try {
    await apiClient.post('/auth/logout');
    
    // Clear tokens
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
    
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}
```

---

## Create Quiz Actions

**File**: `src/lib/actions/quiz.actions.ts`

```typescript
'use server'

import apiClient from '../api/client';

export async function getMyQuizzesAction() {
  try {
    const response = await apiClient.get('/quizzes/my-quizzes');
    return {
      success: true,
      data: response.data.data,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch quizzes',
    };
  }
}

export async function startQuizAction(quizId: string) {
  try {
    const response = await apiClient.get(`/quizzes/${quizId}/start`);
    return {
      success: true,
      data: response.data.data,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to start quiz',
    };
  }
}

export async function submitQuizAction(
  attemptId: string,
  answers: Array<{ questionId: string; selectedAnswer: string }>
) {
  try {
    const response = await apiClient.post(`/quizzes/${attemptId}/submit`, {
      answers,
    });
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to submit quiz',
    };
  }
}

export async function getQuizResultAction(attemptId: string) {
  try {
    const response = await apiClient.get(`/quizzes/results/${attemptId}`);
    return {
      success: true,
      data: response.data.data,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to get result',
    };
  }
}
```

---

## Create Progress Actions

**File**: `src/lib/actions/progress.actions.ts`

```typescript
'use server'

import apiClient from '../api/client';

export async function getProgressAction() {
  try {
    const response = await apiClient.get('/progress');
    return {
      success: true,
      data: response.data.data,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch progress',
    };
  }
}

export async function getProgressChartAction(filters?: {
  startDate?: string;
  endDate?: string;
  subject?: string;
}) {
  try {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.subject) params.append('subject', filters.subject);
    
    const response = await apiClient.get(`/progress/chart?${params}`);
    return {
      success: true,
      data: response.data.data,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch chart data',
    };
  }
}
```

---

## Environment Variables

Add to your frontend `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```

---

## Testing the Integration

### 1. Test Registration

```bash
# Start backend
cd tutor-world-backend
npm start

# Start frontend
cd ../tutor-world-frontend
npm run dev
```

Navigate to `http://localhost:3000/auth?mode=signup` and register a new account.

### 2. Verify Email

Check the backend logs for the verification code (since email might not be configured yet):

```
Verification email sent to <email>
```

Use the 6-digit code to verify your email.

### 3. Login

Login with your credentials at `http://localhost:3000/auth`.

### 4. Admin Panel

Login with admin credentials:
- Email: `admin@tutorworld.com`
- Password: `Admin@123`

---

## Common Issues

### CORS Error

If you see CORS errors, make sure:
1. Backend `FRONTEND_URL` in `.env` matches your frontend URL
2. Backend is running before frontend

### MongoDB Connection Error

```bash
# Start MongoDB (if local)
mongod

# Or use MongoDB Compass to verify connection
```

### JWT Token Issues

Clear localStorage and login again:
```javascript
// In browser console
localStorage.clear()
```

---

## Next Steps

1. **Create Sample Data**
   - Login as admin
   - Create questions via admin panel
   - Create quizzes
   - Assign quizzes to students

2. **Import Students**
   - Use the `sample-students.csv` file
   - Go to admin panel > Students > Import
   - Upload the CSV

3. **Test Student Flow**
   - Login as a student
   - View assigned quizzes
   - Take a quiz
   - View results and progress

4. **Customize**
   - Update email templates in `src/utils/email.ts`
   - Modify UI components
   - Add additional features

---

## API Documentation

See `API_DOCUMENTATION.md` for full API reference.

## Support

For issues:
1. Check backend logs in `logs/` directory
2. Check frontend console for errors
3. Verify environment variables
4. Check MongoDB connection
