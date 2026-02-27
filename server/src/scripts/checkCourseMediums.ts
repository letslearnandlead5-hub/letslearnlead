import mongoose from 'mongoose';
import { Course } from '../models/Course';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Script to check course distribution by medium
 * Usage: tsx src/scripts/checkCourseMediums.ts
 */

const checkCourseMediums = async () => {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/lms';
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB\n');

        // Get all courses
        const allCourses = await Course.find({})
            .select('title medium category')
            .lean();

        console.log('📊 Course Distribution by Medium:');
        console.log('='.repeat(80));

        // Count by medium
        const kannada = allCourses.filter(c => c.medium === 'kannada');
        const english = allCourses.filter(c => c.medium === 'english');
        const both = allCourses.filter(c => c.medium === 'both');
        const undefined = allCourses.filter(c => !c.medium);

        console.log(`\n🔵 Kannada Medium: ${kannada.length} courses`);
        kannada.forEach(c => console.log(`   - ${c.title} (${c.category})`));

        console.log(`\n🟢 English Medium: ${english.length} courses`);
        english.forEach(c => console.log(`   - ${c.title} (${c.category})`));

        console.log(`\n🟣 Both Medium: ${both.length} courses`);
        both.forEach(c => console.log(`   - ${c.title} (${c.category})`));

        if (undefined.length > 0) {
            console.log(`\n⚠️  Undefined Medium: ${undefined.length} courses`);
            undefined.forEach(c => console.log(`   - ${c.title} (${c.category})`));
        }

        console.log('\n' + '='.repeat(80));
        console.log(`Total: ${allCourses.length} courses\n`);

        // Test query performance
        console.log('🔍 Testing query performance...\n');

        const testQueries = [
            { medium: 'kannada', label: 'Kannada' },
            { medium: 'english', label: 'English' },
            { medium: 'both', label: 'Both' }
        ];

        for (const test of testQueries) {
            const start = Date.now();
            const results = await Course.find({ medium: test.medium })
                .select('title')
                .lean()
                .exec();
            const time = Date.now() - start;
            console.log(`${test.label} query: ${time}ms - Found ${results.length} courses`);
        }

        await mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

checkCourseMediums();
