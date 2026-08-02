/**
 * One-time migration: set `status` field on all existing Quiz documents
 * that were created before the 3-state lifecycle was introduced.
 *
 * Run once with:
 *   cd server
 *   npx ts-node src/scripts/migrateQuizStatus.ts
 *
 * Safe to run multiple times (idempotent — skips already-migrated docs).
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
if (!MONGO_URI) {
    console.error('❌  MONGODB_URI not set in environment');
    process.exit(1);
}

async function migrate() {
    console.log('🔌  Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI!);
    console.log('✅  Connected');

    const db = mongoose.connection.db!;
    const quizzes = db.collection('quizzes');

    // --- 1. Set status = 'published' for all docs where isPublished is true and status is not set ---
    const publishedResult = await quizzes.updateMany(
        { isPublished: true, status: { $exists: false } },
        { $set: { status: 'published', draftMeta: {} } }
    );
    console.log(`✅  Set status='published' on ${publishedResult.modifiedCount} quizzes`);

    // --- 2. Set status = 'draft' for all docs where isPublished is false/null and status is not set ---
    const draftResult = await quizzes.updateMany(
        { $or: [{ isPublished: false }, { isPublished: { $exists: false } }], status: { $exists: false } },
        { $set: { status: 'draft', draftMeta: {} } }
    );
    console.log(`✅  Set status='draft' on ${draftResult.modifiedCount} quizzes`);

    // --- 3. Ensure all docs have draftMeta if missing ---
    const metaResult = await quizzes.updateMany(
        { draftMeta: { $exists: false } },
        { $set: { draftMeta: {} } }
    );
    console.log(`✅  Added draftMeta to ${metaResult.modifiedCount} quizzes`);

    // --- 4. Ensure all docs have auditLog array ---
    const auditResult = await quizzes.updateMany(
        { auditLog: { $exists: false } },
        { $set: { auditLog: [] } }
    );
    console.log(`✅  Added auditLog to ${auditResult.modifiedCount} quizzes`);

    console.log('\n🎉  Migration complete!');
    await mongoose.disconnect();
    process.exit(0);
}

migrate().catch((err) => {
    console.error('❌  Migration failed:', err);
    process.exit(1);
});
