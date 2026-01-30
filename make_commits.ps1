# Commit 1
git add package.json package-lock.json .gitignore
git commit -m "Initial project setup with dependencies"

# Commit 2
git add src/config/database.js
git commit -m "Add MongoDB database configuration"

# Commit 3
git add server.js
git commit -m "Create Express server with CORS and basic middleware"

# Commit 4
git add src/models/User.js
git commit -m "Implement User model with password hashing"

# Commit 5
git add src/middleware/auth.js
git commit -m "Add JWT authentication middleware"

# Commit 6
git add src/controllers/authController.js src/routes/auth.js
git commit -m "Implement authentication routes (register, login, getMe)"

# Commit 7
git add src/models/Application.js src/controllers/applicationController.js src/routes/applications.js
git commit -m "Add membership application system with vetting workflow"

# Commit 8
git add src/models/Resource.js src/models/Progress.js
git commit -m "Create Resource and Progress tracking models"

# Commit 9
git add src/controllers/resourceController.js src/routes/resources.js
git commit -m "Implement Resource Hub API with completion tracking"

# Commit 10
git add src/models/Report.js
git commit -m "Add Report model for analytics and metrics"

# Commit 11
git add src/controllers/analyticsController.js src/routes/analytics.js
git commit -m "Build analytics dashboard with KPI aggregation"

# Commit 12
git add src/config/cloudinary.js
git commit -m "Configure Cloudinary for file storage"

# Commit 13
git add src/routes/upload.js
git commit -m "Implement file upload endpoint with Cloudinary SDK"

# Commit 14
git add README.md API_TESTING.md QUICKSTART.md
git commit -m "Add comprehensive API documentation and guides"

# Commit 15
git add BACKEND_REVIEW_GUIDE.md
git commit -m "Add backend code review guide for developers"
