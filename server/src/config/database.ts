import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/websit-edu';

        await mongoose.connect(mongoURI, {
            maxPoolSize: 20,              // Allow up to 20 concurrent DB connections (was 10)
            minPoolSize: 5,               // Keep 5 connections warm — avoids cold-start latency
            serverSelectionTimeoutMS: 5000, // Fail fast if DB unreachable
            socketTimeoutMS: 45000,       // Drop slow queries after 45s
            heartbeatFrequencyMS: 10000,  // Check connection health every 10s
            retryWrites: true,            // Auto-retry write ops on transient network errors
            retryReads: true,             // Auto-retry read ops on transient network errors
        });

        console.log('✅ MongoDB connected successfully');
        console.log(`📊 Database: ${mongoose.connection.name}`);
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};
