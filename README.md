# YAN Platform Backend API

> **Youth Action Network Management Platform** - Complete Node.js REST API

## 🚀 Project Overview

A comprehensive backend system for managing a youth empowerment network platform with membership vetting, resource management, and analytics capabilities.

**Status:** ✅ Fully Functional & Tested  
**Tech Stack:** Node.js, Express, MongoDB Atlas, JWT, Cloudinary

---

## ✨ Features

- 🔐 **JWT Authentication** - Secure user registration and login
- 📋 **Membership Application System** - Multi-step vetting workflow
- 📚 **Resource Hub** - Training materials with progress tracking
- 📊 **Analytics Dashboard** - Real-time KPIs and reporting
- ☁️ **File Upload** - Cloudinary integration for documents
- 🔒 **Role-Based Access** - Admin and Member permissions

---

## 🏗️ Tech Stack

| Technology | Purpose |
|------------|---------|
| Node.js + Express | REST API framework |
| MongoDB Atlas | Cloud database |
| Mongoose | ODM for MongoDB |
| JWT | Authentication tokens |
| bcryptjs | Password hashing |
| Cloudinary | File storage |
| Multer | File upload handling |

---

## 📦 Installation

### Prerequisites
- Node.js (v14+)
- MongoDB Atlas account
- Cloudinary account

### Setup Steps

1. **Clone the repository**
```bash
git clone https://github.com/YOUR_USERNAME/yan-backend.git
cd yan-backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**

Create a `.env` file in the root directory:

```env
# Server
PORT=5000

# Database
MONGO_URI=your_mongodb_connection_string

# Authentication
JWT_SECRET=your_super_secret_jwt_key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

4. **Start the development server**
```bash
npm run dev
```

Server should start at `http://localhost:5000` 🎉

---

## 📚 API Documentation

Complete API documentation available in:
- **[API_TESTING.md](./API_TESTING.md)** - Detailed endpoint guide with examples
- **[QUICKSTART.md](./QUICKSTART.md)** - Quick reference guide

### Quick Reference

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/auth/register` | POST | Register new user | No |
| `/api/auth/login` | POST | User login | No |
| `/api/auth/me` | GET | Get current user | Yes |
| `/api/applications` | POST | Submit application | Yes |
| `/api/applications` | GET | View all applications | Yes (Admin) |
| `/api/resources` | GET | List resources | Yes |
| `/api/resources` | POST | Create resource | Yes (Admin) |
| `/api/analytics/dashboard` | GET | Admin dashboard | Yes (Admin) |
| `/api/analytics/report` | POST | Submit report | Yes |
| `/api/upload` | POST | Upload file | Yes |

---

## 🧪 Testing

### Test User Credentials
```
Email: kevin@yan.com
Password: admin123
Role: Admin
```

### Using Postman
1. Import the collection from [API_TESTING.md](./API_TESTING.md)
2. Login to get JWT token
3. Set token in Authorization header for protected routes
4. Test all endpoints

**All endpoints have been verified working!** ✅

---

## 📁 Project Structure

```
youth-action-network/
├── src/
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── middleware/
│   │   └── auth.js               # JWT authentication
│   ├── models/
│   │   ├── User.js               # User schema
│   │   ├── Application.js        # Application schema
│   │   ├── Resource.js           # Resource schema
│   │   ├── Progress.js           # Progress tracking
│   │   └── Report.js             # Analytics reports
│   └── routes/
│       ├── auth.js               # Auth endpoints
│       ├── applications.js       # Application endpoints
│       ├── resources.js          # Resource endpoints
│       ├── analytics.js          # Analytics endpoints
│       └── upload.js             # File upload
├── server.js                     # Express app entry point
├── .env                          # Environment variables (not in repo)
├── .gitignore
├── package.json
├── API_TESTING.md                # Complete API documentation
├── QUICKSTART.md                 # Quick start guide
└── README.md                     # This file
```

---

## 🔒 Security Features

- ✅ Password hashing with bcrypt (12 rounds)
- ✅ JWT token-based authentication
- ✅ Protected routes with middleware
- ✅ Role-based access control (Admin/Member)
- ✅ Environment variables for sensitive data
- ✅ CORS enabled for frontend integration

---

## 🚀 Deployment

### Recommended Platforms
- **Render.com** (Free tier available)
- **Railway.app** ($5 free credit)
- **Heroku** (Paid)

### Deployment Steps
1. Push code to GitHub
2. Connect platform to repository
3. Add environment variables in platform dashboard
4. Deploy!

**Environment variables needed:**
- `MONGO_URI`
- `JWT_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

---

## 👥 Team

**Backend Developer:** Kevin  
**Contact:** kevin@yan.com  
**Project:** Youth Action Network Platform

---

## 📄 License

This project is for educational purposes as part of a youth empowerment platform.

---

## 🙏 Acknowledgments

- MongoDB Atlas for cloud database hosting
- Cloudinary for file storage
- All contributors and reviewers

---

## 📞 Support

For questions or issues:
1. Check [API_TESTING.md](./API_TESTING.md) for API details
2. Review [BACKEND_REVIEW_GUIDE.md](./BACKEND_REVIEW_GUIDE.md) for code review
3. Contact the development team

---

**Happy Coding!** 🚀
