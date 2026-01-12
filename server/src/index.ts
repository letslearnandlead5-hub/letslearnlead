import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "path";
import { connectDB } from "./config/database";
import { errorHandler } from "./middleware/error";
import { configurePassport } from "./config/passport";
import passport from "passport";

// 🔹 Import routes
import authRoutes from "./routes/auth";
import courseRoutes from "./routes/courses";
import noteRoutes from "./routes/notes";
import shopRoutes from "./routes/shop";
import adminRoutes from "./routes/admin";
import notificationRoutes from "./routes/notifications";
import newsletterRoutes from "./routes/newsletter";
import paymentRoutes from "./routes/payment";
import progressRoutes from "./routes/progress";
import invoiceRoutes from "./routes/invoice";
import enrollmentRoutes from "./routes/enrollment";
import doubtRoutes from "./routes/doubts";
import quizRoutes from "./routes/quizzes";
import settingsRoutes from "./routes/settings";
import statsRoutes from "./routes/stats";

// 🔹 Load environment variables
dotenv.config();

// 🔹 Create app
const app = express();
app.set('trust proxy', 1);

// 🔹 Connect to database
connectDB();

// 🔹 Configure Passport for Google OAuth
configurePassport();

// 🔹 Allowed frontend origins
const allowedOrigins = [
    "https://letslearnandlead.com",
    "https://www.letslearnandlead.com"
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

// 🔹 Required middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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
app.use("/api/shop", shopRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/invoice", invoiceRoutes);
app.use("/api/enrollment", enrollmentRoutes);
app.use("/api/doubts", doubtRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/stats", statsRoutes);

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

