import mongoose from 'mongoose';
import { Course } from '../models/Course';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from server directory
dotenv.config({ path: path.join(__dirname, '../../.env') });

const testGradeFiltering = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            throw new Error('MONGO_URI not found in environment variables');
        }
        
        // Connect to MongoDB
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB\n');

        // Test different grade filters
        const grades = ['6th', '7th', '8th', '9th', '10th', '11th', '12th'];

        console.log('🧪 Testing Grade Filtering:\n');
        console.log('='.repeat(80));

        for (const grade of grades) {
            const filter = { category: 'science', grade, medium: 'kannada' };
            const courses = await Course.find(filter).select('title grade category medium').lean();
            
            console.log(`\n📋 Filter: Science + ${grade} + Kannada`);
            console.log(`   Found: ${courses.length} course(s)`);
            if (courses.length > 0) {
                courses.forEach(c => {
                    console.log(`   - ${c.title} (Grade: ${c.grade})`);
                });
            }
        }

        console.log('\n' + '='.repeat(80));
        console.log('\n🔍 All courses in database:');
        const allCourses = await Course.find({}).select('title grade category medium').lean();
        allCourses.forEach(c => {
            console.log(`   - ${c.title}`);
            console.log(`     Category: ${c.category}, Grade: ${c.grade}, Medium: ${c.medium}`);
        });

        console.log('\n✅ Test complete');
        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

testGradeFiltering();
