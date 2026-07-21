import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/websit-edu';

        await mongoose.connect(mongoURI, {
            maxPoolSize: 20,              // Allow up to 20 concurrent DB connections
            minPoolSize: 5,               // Keep 5 connections warm — avoids cold-start latency
            serverSelectionTimeoutMS: 5000, // Fail fast if DB unreachable
            socketTimeoutMS: 45000,       // Drop slow queries after 45s
            heartbeatFrequencyMS: 10000,  // Check connection health every 10s
            retryWrites: true,            // Auto-retry write ops on transient network failover
            retryReads: true,             // Auto-retry read ops on transient network failover
        });

        console.log('✅ MongoDB connected successfully');
        console.log(`📊 Database: ${mongoose.connection.name}`);

        // Inspect deployment topology (Replica Set vs Standalone)
        const db = mongoose.connection.db;
        if (db) {
            const admin = db.admin();
            const info = await admin.command({ hello: 1 }).catch(() => admin.command({ isMaster: 1 }));
            if (info?.setName) {
                console.log(`🌀 MongoDB Replica Set: Active (Set Name: "${info.setName}") — Multi-document ACID transactions & auto-failover enabled`);
            } else {
                console.log('ℹ️ MongoDB Topology: Standalone / Local — Single node environment');
            }
        }
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};
