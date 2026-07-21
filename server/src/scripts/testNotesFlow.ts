import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { Note } from '../models/Note';
import { Course } from '../models/Course';
import { User } from '../models/User';
import { Enrollment } from '../models/Enrollment';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function runNotesTest() {
    try {
        console.log('--- STARTING NOTES SYSTEM INTEGRATION TEST ---');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/letslearnlead');
        console.log('✅ Connected to MongoDB');

        // 1. Verify indexes on Note collection
        const indexes = await Note.collection.getIndexes();
        console.log('📌 Note Collection Indexes:', Object.keys(indexes));

        // 2. Backfill status: 'active' for legacy notes missing status
        await Note.updateMany({ status: { $exists: false } }, { $set: { status: 'active' } });
        await Note.updateMany({ status: null }, { $set: { status: 'active' } });

        // 3. Count active notes and orphan notes (notes missing subjectId)
        const totalNotes = await Note.countDocuments();
        const activeNotes = await Note.countDocuments({ status: 'active' });
        const missingSubjectNotes = await Note.countDocuments({
            $or: [{ subjectId: { $exists: false } }, { subjectId: null }],
        });


        console.log(`📊 Total Notes: ${totalNotes}`);
        console.log(`📊 Active Notes: ${activeNotes}`);
        console.log(`⚠️ Notes without SubjectId (Orphans): ${missingSubjectNotes}`);

        // 3. Test note query by Course + Subject
        const sampleCourse = await Course.findOne({ 'subjects.0': { $exists: true } });
        if (sampleCourse && sampleCourse.subjects && sampleCourse.subjects.length > 0) {
            const courseId = sampleCourse._id.toString();
            const subject = sampleCourse.subjects[0];
            const subjectId = (subject as any)._id.toString();

            console.log(`\n🔍 Querying notes for Course "${sampleCourse.title}" (${courseId}) -> Subject "${subject.name}" (${subjectId})...`);

            const notesForSubject = await Note.find({
                courseId,
                subjectId,
                status: 'active',
            }).sort({ createdAt: -1 });

            console.log(`✅ Found ${notesForSubject.length} notes for Subject "${subject.name}"`);
            notesForSubject.forEach((n, i) => {
                console.log(`   [${i + 1}] Title: "${n.title}" | Type: ${n.fileType} | Status: ${n.status}`);
            });
        } else {
            console.log('⚠️ No course with subjects found for testing query.');
        }

        console.log('\n--- NOTES SYSTEM INTEGRATION TEST COMPLETED SUCCESSFULLY ---');
        process.exit(0);
    } catch (err) {
        console.error('❌ Test failed with error:', err);
        process.exit(1);
    }
}

runNotesTest();
