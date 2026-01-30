# Complete API Testing Guide

## Base URL
```
http://localhost:5000
```

## 📝 Step-by-Step Testing Flow

### 1. Register an Admin User
```
POST /api/auth/register

Body:
{
  "name": "Admin User",
  "email": "admin@yan.com",
  "password": "admin123",
  "role": "admin",
  "organization": "YAN HQ"
}

Response: Copy the `token`
```

### 2. Register a Regular Member
```
POST /api/auth/register

Body:
{
  "name": "Member Org",
  "email": "member@example.com",
  "password": "member123",
  "role": "member",
  "organization": "Youth Empowerment Org"
}

Response: Copy the `token`
```

### 3. Login
```
POST /api/auth/login

Body:
{
  "email": "admin@yan.com",
  "password": "admin123"
}

Response: Copy the `token` - use this for all protected routes
```

### 4. Get Current User (Protected)
```
GET /api/auth/me

Headers:
Authorization: Bearer YOUR_TOKEN_HERE
```

---

## 📋 Application/Vetting APIs

### Submit Application
```
POST /api/applications

Headers:
Authorization: Bearer USER_TOKEN

Body:
{
  "submissionData": {
    "organizationName": "Youth Leaders Rwanda",
    "sector": "Education",
    "yearsOfOperation": 3,
    "targetPopulation": "Youth 18-30",
    "motivation": "We want to expand our impact through YAN network"
  },
  "documents": [
    {
      "name": "Registration Certificate",
      "url": "https://example.com/cert.pdf"
    }
  ]
}
```

### View All Applications (Admin Only)
```
GET /api/applications

Headers:
Authorization: Bearer ADMIN_TOKEN
```

### Approve/Reject Application (Admin Only)
```
PATCH /api/applications/{APPLICATION_ID}/status

Headers:
Authorization: Bearer ADMIN_TOKEN

Body:
{
  "status": "approved",
  "reviewerNotes": "Excellent application. Welcome to YAN!"
}

Status options: "submitted", "screening", "under_review", "approved", "rejected"
```

---

## 📚 Resource Hub APIs

### Create Resource (Admin Only)
```
POST /api/resources

Headers:
Authorization: Bearer ADMIN_TOKEN

Body:
{
  "title": "Financial Management Training",
  "description": "Complete guide to nonprofit financial management",
  "type": "video",
  "url": "https://youtube.com/watch?v=example",
  "category": "finance",
  "skillArea": "Budgeting",
  "difficulty": "beginner"
}

Types: "video", "pdf", "guide", "module", "case_study"
Categories: "finance", "monitoring_evaluation", "governance", "advocacy", "leadership", "project_management", "other"
```

### Get All Resources
```
GET /api/resources

Headers:
Authorization: Bearer ANY_USER_TOKEN

Query Params (optional):
?category=finance&type=video&difficulty=beginner
```

### Mark Resource as Completed
```
POST /api/resources/{RESOURCE_ID}/complete

Headers:
Authorization: Bearer USER_TOKEN
```

### Get My Progress
```
GET /api/resources/progress/me

Headers:
Authorization: Bearer USER_TOKEN
```

---

## 📊 Reporting & Analytics APIs

### Submit a Report
```
POST /api/analytics/report

Headers:
Authorization: Bearer MEMBER_TOKEN

Body:
{
  "reportType": "activity",
  "period": "Q1 2024",
  "metrics": {
    "activitiesConducted": 12,
    "sector": "Education",
    "location": "Kigali",
    "targetGroup": "Youth",
    "beneficiaries": 250
  }
}

Report Types: "activity", "beneficiary", "engagement", "capacity_needs", "compliance"
```

### Get My Reports
```
GET /api/analytics/my-reports

Headers:
Authorization: Bearer MEMBER_TOKEN
```

### Get Dashboard (Admin Only) ⭐
```
GET /api/analytics/dashboard

Headers:
Authorization: Bearer ADMIN_TOKEN

Returns:
- Total users by role
- Applications by status
- Resources by type
- Recent activity
```

### Get All Reports (Admin Only)
```
GET /api/analytics/reports

Headers:
Authorization: Bearer ADMIN_TOKEN

Query Params (optional):
?reportType=activity&period=Q1 2024
```

---

## ☁️ File Upload APIs (Cloudinary)

### Upload Single File
```
POST /api/upload

Headers:
Authorization: Bearer USER_TOKEN
Body: form-data
  key: "file"
  value: (Select a file from your computer)
  type: File

Response:
{
  "success": true,
  "data": {
    "url": "https://res.cloudinary.com/...",
    "filename": "my-document",
    "format": "pdf"
  }
}
```

---

## 🎯 Complete Demo Flow

1. **Register Admin** → Get admin token
2. **Register 2-3 Members** → Get member tokens
3. **Members Submit Applications** → Using member tokens
4. **Admin Views Applications** → Using admin token
5. **Admin Approves Some Applications** → Change status to "approved"
6. **Admin Uploads Resources** → Videos, PDFs
7. **Members View Resources** → Filter by category
8. **Members Mark Resources Complete** → Track progress
9. **Members Submit Reports** → Activity, beneficiary data
10. **Admin Views Dashboard** → See all KPIs

---

## 🔥 Pro Tips for Postman

1. **Create Environment Variables**:
   - `base_url` = `http://localhost:5000`
   - `admin_token` = (paste after login)
   - `member_token` = (paste after login)

2. **Use Collections**:
   - Create one collection per module (Auth, Applications, Resources, Analytics)

3. **Pre-request Scripts** (Auto-add token):
```javascript
pm.request.headers.add({
  key: 'Authorization',
  value: 'Bearer ' + pm.environment.get('admin_token')
});
```

4. **Save Responses**:
   - Save IDs from responses to use in other requests
   - Example: Save `application._id` to approve it later
