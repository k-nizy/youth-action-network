require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./src/config/database');

// Import routes
const authRoutes = require('./src/routes/auth');
const applicationRoutes = require('./src/routes/applications');
const resourceRoutes = require('./src/routes/resources');
const analyticsRoutes = require('./src/routes/analytics');
const uploadRoutes = require('./src/routes/upload');
const organizationRoutes = require('./src/routes/organizations');
const opportunityRoutes = require('./src/routes/opportunities');
const eventRoutes = require('./src/routes/events');
const adminRoutes = require('./src/routes/admin');
const courseRoutes = require('./src/routes/courses');
const enrollmentRoutes = require('./src/routes/enrollments');
const lessonRoutes = require('./src/routes/lessons');
const progressRoutes = require('./src/routes/progress');
const certificateRoutes = require('./src/routes/certificates');
const submissionRoutes = require('./src/routes/submissions');
const contentRoutes = require('./src/routes/content');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('./src/middleware/sanitize');
const errorHandler = require('./src/middleware/error');

const app = express();
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

// Load Swagger document
let swaggerDocument;
try {
    const yamlPath = path.join(__dirname, 'swagger.yaml');
    console.log(`[DEBUG] Loading Swagger from: ${yamlPath}`);
    swaggerDocument = YAML.load(yamlPath);
    console.log('✅ Swagger document loaded successfully');
} catch (error) {
    console.error('❌ Failed to load Swagger document:', error.message);
}

// Connect to database
connectDB();

// Basic Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Security Middleware (Configured for Swagger compat)
app.use(helmet({
    contentSecurityPolicy: false
}));
app.use(mongoSanitize);

// CORS
app.use(cors({
    origin: function (origin, callback) {
        if (!origin ||
            origin.startsWith('http://localhost:') ||
            origin.startsWith('http://127.0.0.1:') ||
            origin.replace(/\/$/, "") === process.env.FRONTEND_URL?.replace(/\/$/, "")) {
            callback(null, true);
        } else {
            callback(null, true); // Permissive for local dev
        }
    },
    credentials: true
}));

// Swagger Documentation - Mounted at root /docs to avoid confusion
if (swaggerDocument) {
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    console.log('🚀 Swagger UI available at /docs');
}

// Health Check Route
app.get('/api/v1/health', (req, res) => {
    res.json({
        success: true,
        status: 'online',
        timestamp: new Date().toISOString(),
        swagger: !!swaggerDocument
    });
});

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: { success: false, message: 'Too many requests' }
});
app.use('/api', limiter);

// Routes
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'YAN Platform API is running 🚀'
    });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/applications', applicationRoutes);
app.use('/api/v1/resources', resourceRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/organizations', organizationRoutes);
app.use('/api/v1/opportunities', opportunityRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/enrollments', enrollmentRoutes);
app.use('/api/v1/lessons', lessonRoutes);
app.use('/api/v1/progress', progressRoutes);
app.use('/api/v1/certificates', certificateRoutes);
app.use('/api/v1/submissions', submissionRoutes);
app.use('/api/v1', contentRoutes);

// Error handling
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`,
        suggestion: req.originalUrl.includes('docs') ? 'Try /docs instead' : 'Check API_TESTING.md'
    });
});

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);

    // ============================================================
    // KEEP-ALIVE SELF-PING (Prevents Render free-tier shutdown)
    // Render spins down free-tier instances after 15 min of inactivity.
    // This pings the health endpoint every 14 min to keep it alive.
    // ============================================================
    if (process.env.NODE_ENV === 'production') {
        const PING_INTERVAL = 14 * 60 * 1000; // 14 minutes
        const BACKEND_URL = process.env.RENDER_EXTERNAL_URL || `https://yan-backend-gagz.onrender.com`;

        setInterval(async () => {
            try {
                const res = await fetch(`${BACKEND_URL}/api/v1/health`);
                const data = await res.json();
                console.log(`🏓 Keep-alive ping: ${data.status} at ${new Date().toISOString()}`);
            } catch (err) {
                console.error('🏓 Keep-alive ping failed:', err.message);
            }
        }, PING_INTERVAL);

        console.log(`🏓 Keep-alive pinger active — pinging every 14 minutes`);
    }
});
