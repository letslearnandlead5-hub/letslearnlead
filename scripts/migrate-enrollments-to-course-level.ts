/**
 * Migration: Convert existing subject-level enrollments to course-level
 *
 * For each student who has ≥1 paid Enrollment record for a course,
 * creates one course-level Enrollment (subjectId=null) if it doesn't exist.
 * The old per-subject records are kept for backward compatibility.
 *
 * Run: npx ts-node scripts/migrate-enrollments-to-course-level.ts
 */

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { Enrollment } from '../server/src/models/Enrollment';

async function main() {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/letslearnlead';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected.\n');

    // Find all paid subject-level enrollments
    const subjectEnrollments = await Enrollment.find({
        status: 'paid',
        subjectId: { $ne: null, $exists: true },
    }).lean();

    console.log(`Found ${subjectEnrollments.length} subject-level enrollments to process.`);

    // Group by userId+courseId
    const groupMap = new Map<string, any>();
    for (const e of subjectEnrollments) {
        const key = `${e.userId}-${e.courseId}`;
        if (!groupMap.has(key)) {
            groupMap.set(key, { userId: e.userId, courseId: e.courseId, amount: e.amount, currency: e.currency, purchaseDate: e.purchaseDate });
        }
    }

    console.log(`Found ${groupMap.size} unique user+course combinations.\n`);

    let created = 0;
    let skipped = 0;

    for (const [key, data] of groupMap.entries()) {
        // Check if course-level enrollment already exists
        const existing = await Enrollment.findOne({
            userId: data.userId,
            courseId: data.courseId,
            subjectId: null,
        });

        if (existing) {
            console.log(`  SKIP (already exists): ${key}`);
            skipped++;
            continue;
        }

        // Create course-level enrollment
        await Enrollment.create({
            userId: data.userId,
            courseId: data.courseId,
            subjectId: null,
            subjectName: '',
            status: 'paid',
            amount: data.amount || 0,
            currency: data.currency || 'INR',
            purchaseDate: data.purchaseDate || new Date(),
            completionPercentage: 0,
        });

        console.log(`  CREATED course-level enrollment: ${key}`);
        created++;
    }

    console.log(`\nDone. Created: ${created}, Skipped: ${skipped}`);
    await mongoose.disconnect();
}

main().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
});
