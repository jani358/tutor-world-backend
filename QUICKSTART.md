# Quick Start Guide

Get the Tutor World Backend up and running in 5 minutes!

## Prerequisites

- **Node.js** (v18 or higher)
- **MongoDB** (local or remote)
- **npm** or **pnpm**

---

## Step 1: Install Dependencies

```bash
cd tutor-world-backend
npm install
```

---

## Step 2: Setup MongoDB

### Option A: Local MongoDB

```bash
# Install MongoDB: https://www.mongodb.com/try/download/community

# Start MongoDB
mongod
```

### Option B: MongoDB Atlas (Cloud)

1. Create free account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Get connection string
4. Update `.env` with your connection string

---

## Step 3: Configure Environment

The `.env` file is already created. Update if needed:

```env
PORT=5001
MONGODB_URI=mongodb://localhost:27017/tutor-world
JWT_SECRET=your-secret-key-here
```

For Gmail email:
1. Enable 2FA on your Google account
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Update `.env`:

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-digit-app-password
```

---

## Step 4: Start the Server

```bash
npm start
```

You should see:
```
🚀 Server is running on port 5001
📊 Environment: development
✅ Database connected successfully
✅ Admin user created with email: admin@tutorworld.com
   Default password: Admin@123
⚠️  Please change the admin password after first login!
```

---

## Step 5: Test the API

### Test Health Check

```bash
curl http://localhost:5001/health
```

Expected response:
```json
{
  "status": "success",
  "message": "Tutor World Backend is running",
  "timestamp": "2024-01-15T10:00:00.000Z"
}
```

### Test Admin Login

```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@tutorworld.com",
    "password": "Admin@123"
  }'
```

You should receive an access token!

---

## Step 6: Create Sample Data

### 1. Login to get access token

Use the admin login from Step 5. Copy the `accessToken` from the response.

### 2. Create a Question

```bash
curl -X POST http://localhost:5001/api/admin/questions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "title": "What is 5 + 5?",
    "questionType": "multiple_choice",
    "difficulty": "easy",
    "subject": "Mathematics",
    "grade": "Grade 3",
    "options": [
      {"text": "8", "isCorrect": false},
      {"text": "10", "isCorrect": true},
      {"text": "12", "isCorrect": false}
    ],
    "explanation": "5 + 5 = 10",
    "points": 10
  }'
```

### 3. Import Sample Students

```bash
curl -X POST http://localhost:5001/api/admin/students/import \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@sample-students.csv"
```

---

## Step 7: Connect Frontend

1. Start the backend (keep it running)
2. Open another terminal
3. Navigate to frontend:

```bash
cd ../tutor-world-frontend
```

4. Update `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```

5. Start frontend:

```bash
npm run dev
```

6. Open http://localhost:3000

---

## Common Commands

### Development Mode
```bash
npm start          # Start with auto-reload
```

### Production Mode
```bash
npm run build      # Compile TypeScript
npm run start:prod # Start production server
```

### TypeScript Compilation
```bash
npm run build      # Compile once
npm run start:ts   # Watch mode
```

---

## Directory Structure

```
tutor-world-backend/
├── src/
│   ├── config/         # Configuration files
│   ├── controllers/    # Request handlers
│   ├── middlewares/    # Express middlewares
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── utils/          # Utility functions
│   ├── validations/    # Request validations
│   └── index.ts        # Entry point
├── logs/               # Application logs
├── uploads/            # Uploaded files
├── .env                # Environment variables
├── package.json        # Dependencies
└── tsconfig.json       # TypeScript config
```

---

## Default Accounts

### Admin Account
- **Email**: `admin@tutorworld.com`
- **Password**: `Admin@123`
- **Role**: Admin

### Sample Students (after import)
- **Email**: `john.doe@example.com`
- **Password**: `Student123`
- **Role**: Student

---

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 5001
# Windows:
netstat -ano | findstr :5001
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:5001 | xargs kill -9
```

### MongoDB Connection Failed

Check if MongoDB is running:
```bash
# Windows:
services.msc  # Look for MongoDB

# Mac:
brew services list

# Linux:
sudo systemctl status mongod
```

### TypeScript Errors

```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build
```

### Email Not Sending

For development, check backend logs for the verification code:
```
logs/all.log
```

The verification code is printed in the logs even if email fails.

---

## Next Steps

1. ✅ Server running
2. ✅ Database connected
3. ✅ Admin account created
4. 📝 Create questions
5. 📝 Create quizzes
6. 📝 Assign to students
7. 🎉 Start learning!

---

## API Documentation

Full API documentation: `API_DOCUMENTATION.md`

Frontend integration guide: `INTEGRATION_GUIDE.md`

---

## Need Help?

- Check logs: `logs/all.log` or `logs/error.log`
- Review `.env` configuration
- Verify MongoDB connection
- Check port availability

---

## Production Deployment

### Environment Variables

Update for production:
```env
NODE_ENV=production
PORT=5001
MONGODB_URI=your-production-mongodb-uri
JWT_SECRET=very-secure-random-string
FRONTEND_URL=https://your-domain.com
```

### Build

```bash
npm run build
npm run start:prod
```

### Process Manager (PM2)

```bash
npm install -g pm2
pm2 start dist/index.js --name tutor-world-backend
pm2 save
pm2 startup
```

---

Happy Coding! 🚀
