# 🌍 Youth Action Network (YAN) Platform

The **Youth Action Network (YAN)** platform is a comprehensive, full-stack web application designed to empower young African leaders. It serves as a central hub for capacity building, advocacy, community outreach, and network expansion.

![Platform Overview](https://img.shields.io/badge/Status-Active-brightgreen) ![License](https://img.shields.io/badge/License-MIT-blue) ![Version](https://img.shields.io/badge/Version-1.0.0-orange)

## ✨ Key Features

- 🎓 **Capacity Building (LMS)**: Interactive courses with real-time progress tracking and automated certificate generation.
- 🌐 **Network Directory**: A spotlight on partner organizations, impact metrics, and youth initiatives across Rwanda.
- 📊 **Admin Dashboard**: Comprehensive analytics, user management, and a robust application vetting workflow.
- 📧 **Automated Notifications**: Deep integration with Nodemailer for secure, styled HTML email dispatch (Verification, Welcome, Admin Alerts).
- 📸 **Dynamic Gallery**: Data-driven media showcasing live community impact, workshops, and outreach events.
- 🛡️ **Enterprise-Grade Security**: JWT-based authentication using `httpOnly` refresh cookies, mitigating XSS attacks, with an automated token-rotation API interceptor.
- ⚡ **Production Reliability**: High-availability Edge CDN deployment for both frontend clients and backend APIs.

## 🛠️ Technology Stack

**Frontend**
- HTML5 & CSS3 (Vanilla, carefully structured for peak performance and aesthetics)
- Vanilla JavaScript (ES6+ with a custom unified API client architecture)
- Chart.js (Dashboard Analytics)

**Backend**
- Node.js & Express.js
- MongoDB & Mongoose (Database & ODM)
- JWT & bcryptjs (Authentication & Cryptography)
- Nodemailer (Email Delivery)
- Cloudinary (Media management and file uploads)

## 🚀 Quick Start (Local Development)

The easiest way to run the entire stack locally is by using the provided batch script on Windows:

```bash
# 1. Clone the repository
git clone https://github.com/k-nizy/youth-action-network.git
cd youth-action-network

# 2. Configure Environment Variables
# Duplicate 'backend/.env.example' to 'backend/.env' and fill in your credentials:
# (MONGODB_URI, JWT_SECRET, SMTP_EMAIL, SMTP_PASSWORD, etc.)

# 3. Start the Platform
.\run-yan.bat
```
*(The script automatically installs dependencies for both frontend/backend and launches them concurrently on ports `8001` and `5000`.)*

## ☁️ Deployment Architecture

- **Frontend**: Hosted on [Vercel Edge Network](https://youth-action-network.vercel.app) for global CDN delivery.
- **Backend API**: Hosted as high-performance Serverless Functions on Vercel at `https://youth-action-network-24pe.vercel.app`.
- **Database**: MongoDB Atlas Cloud Cluster.

> **Architecture Note**: The backend was successfully migrated from Render to Vercel Serverless Edge Functions, eliminating legacy 15-minute cold start delays and guaranteeing instant, high-speed API resolution.

---
*Built with passion for the Youth Advocates Network by k-nizy.*
