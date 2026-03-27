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
- ⚡ **Production Reliability**: Built-in keep-alive self-pinging mechanisms to guarantee high availability on containerized cloud deployments.

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

- **Frontend**: Hosted on [Vercel](https://youth-action-network.vercel.app) for global edge CDN delivery.
- **Backend**: Hosted on [Render](https://yan-backend-gagz.onrender.com) Web Services.
- **Database**: MongoDB Atlas Cloud Cluster.

> **Note on Backend Latency**: The API is hosted on Render's free tier, which typically spins down instances after 15 minutes of inactivity. However, the system includes an automated `setInterval` keep-alive pinger that executes every 14 minutes, significantly reducing cold-start delays.

---
*Built with passion for the Youth Advocates Network by k-nizy.*
