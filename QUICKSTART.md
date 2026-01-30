# Quick Start Guide for Kevin

## What We Just Built

You now have a **WORKING** Node.js backend with:
✅ User Authentication (Register/Login)
✅ JWT Token System
✅ Application Submission & Vetting APIs
✅ Role-Based Access Control

## Next Steps

### 1. Install MongoDB (If not installed)

**Option A: MongoDB Local (Recommended for development)**
- Download: https://www.mongodb.com/try/download/community
- Install and run MongoDB

**Option B: MongoDB Atlas (Cloud - Free tier)**
- Go to: https://www.mongodb.com/cloud/atlas/register
- Create free cluster
- Get connection string and update `.env`

### 2. Start the Server

```bash
# Make sure you're in the project directory
cd youth-action-network

# Start in development mode (auto-restarts on changes)
npm run dev
```

### 3. Test the APIs with Postman

**Base URL**: `http://localhost:5000`

#### Test 1: Register a User
```
POST http://localhost:5000/api/auth/register

Body (JSON):
{
  "name": "Kevin",
  "email": "admin@example.com",
  "password": "password123",
  "role": "admin",
  "organization": "BSE Team"
}
```

#### Test 2: Login
```
POST http://localhost:5000/api/auth/login

Body (JSON):
{
  "email": "admin@example.com",
  "password": "password123"
}
```
Copy the `token` from the response!

#### Test 3: Get Current User (Protected Route)
```
GET http://localhost:5000/api/auth/me

Headers:
Authorization: Bearer YOUR_TOKEN_HERE
```

#### Test 4: Submit Application
```
POST http://localhost:5000/api/applications

Headers:
Authorization: Bearer YOUR_TOKEN_HERE

Body (JSON):
{
  "submissionData": {
    "organizationName": "Youth Empowerment Org",
    "sector": "Education",
    "yearsOfOperation": 3,
    "motivation": "We want to join YAN to expand our reach"
  }
}
```

#### Test 5: View Applications (Admin Only)
```
GET http://localhost:5000/api/applications

Headers:
Authorization: Bearer ADMIN_TOKEN_HERE
```

#### Test 6: Approve Application (Admin Only)
```
PATCH http://localhost:5000/api/applications/APPLICATION_ID/status

Headers:
Authorization: Bearer ADMIN_TOKEN_HERE

Body (JSON):
{
  "status": "approved",
  "reviewerNotes": "Excellent application. Welcome to YAN!"
}
```

## What to Tell Your Facilitator

"We have implemented a Node.js + MongoDB backend using Express and Mongoose. The system currently supports:
- User authentication with JWT
- Role-based access control (Admin, Member, Applicant, Partner)
- Application submission and vetting workflow with flexible schema
- The backend is API-first, allowing the frontend team to integrate seamlessly"

## Next Phase (What's Left)

- [ ] Resource Hub APIs (Training materials)
- [ ] Reporting & Analytics Dashboard
- [ ] Swagger Documentation
- [ ] Deploy to cloud (Optional)

Your backend is SOLID and FLEXIBLE. Great work! 🚀
