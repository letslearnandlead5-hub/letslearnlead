import express from "express";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "path";
import helmet from "helmet";
import { connectDB } from "./config/database";
import { errorHandler } from "./middleware/error";
import { configurePassport } from "./config/passport";
import passport from "passport";

// 🔹 Import routes
import authRoutes from "./routes/auth";
import courseRoutes from "./routes/courses";
import noteRoutes from "./routes/notes";
import adminRoutes from "./routes/admin";
import notificationRoutes from "./routes/notifications";
import newsletterRoutes from "./routes/newsletter";
import progressRoutes from "./routes/progress";
import invoiceRoutes from "./routes/invoice";
import enrollmentRoutes from "./routes/enrollment";
import doubtRoutes from "./routes/doubts";
import quizRoutes from "./routes/quizzes";
import settingsRoutes from "./routes/settings";
import statsRoutes from "./routes/stats";
import contactRoutes from "./routes/contact";
import userNotesRoutes from "./routes/userNotes";


// 🔹 Load environment variables
dotenv.config();

// 🔹 CRITICAL: Validate required environment variables
const requiredEnvVars = ['JWT_SECRET', 'MONGODB_URI'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
    console.error('❌ FATAL ERROR: Missing required environment variables:');
    missingEnvVars.forEach(varName => {
        console.error(`   - ${varName}`);
    });
    console.error('\nPlease set these variables in your .env file before starting the server.');
    process.exit(1);
}

// Validate JWT_SECRET strength (minimum 32 characters)
if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.error('❌ FATAL ERROR: JWT_SECRET must be at least 32 characters long for security.');
    console.error('   Generate a strong secret with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
    process.exit(1);
}

console.log('✅ Environment variables validated');

// 🔹 Create app
const app = express();
app.set('trust proxy', 1);

// 🔹 Gzip compression — reduces JSON response size by ~70-80%
app.use(compression());

// 🔹 Connect to database
connectDB();

// 🔹 Configure Passport for Google OAuth
configurePassport();

// 🔹 Allowed frontend origins
const allowedOrigins = [
    "https://letslearnandlead.com",
    "https://www.letslearnandlead.com",
    // Add localhost for development
    ...(process.env.NODE_ENV === 'development' ? [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000"
    ] : [])
];

// 🔹 CORS (MUST be before routes)
app.use(
    cors({
        origin: (origin, callback) => {
            // allow server-to-server, curl, postman
            if (!origin) return callback(null, true);

            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            return callback(new Error("CORS not allowed"));
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"]
    })
);

// 🔹 Security headers with Helmet
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for Tailwind
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:", "http:"],
            connectSrc: ["'self'", "https://api.letslearnandlead.com"],
            frameSrc: ["'self'", "https://api.letslearnandlead.com"], // Allow iframes for PDFs
            fontSrc: ["'self'", "data:"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
        },
    },
    crossOriginEmbedderPolicy: false, // Allow embedding resources
    crossOriginResourcePolicy: false, // Don't block CORS requests
}));

console.log('✅ Security headers configured');

// 🔹 Required middleware - Increase body size limit for image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
app.use(passport.initialize());

// 🔹 Serve static files
app.use('/invoices', express.static(path.join(__dirname, '../invoices')));

// Serve notes files with permissive headers for iframe viewing
app.use('/notes', (req, res, next) => {
    res.header('X-Frame-Options', 'SAMEORIGIN');
    res.header('Content-Security-Policy', "frame-ancestors 'self' http://localhost:5173 https://localhost:5173 https://letslearnandlead.com https://www.letslearnandlead.com");
    res.header('Access-Control-Allow-Origin', '*');
    next();
});
app.use('/notes', express.static(path.join(__dirname, '../public/notes')));

// Add CORS headers for video files to allow cross-origin access
app.use('/videos', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
});
app.use('/videos', express.static(path.join(__dirname, '../public/videos')));

// 🔹 Routes
app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/invoice", invoiceRoutes);
app.use("/api/enrollment", enrollmentRoutes);
app.use("/api/doubts", doubtRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/user-notes", userNotesRoutes);


// 🔹 API Health check
app.get("/", (req, res) => {
    res.json({
        status: "API is running",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// 🔹 Error handler (must be last)
app.use(errorHandler);

// 🔹 Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

export default app;

