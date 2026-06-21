import mongoose from 'mongoose';
import { Course } from '../models/Course';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Script to check all course details including category and grade
 * Usage: npx tsx src/scripts/checkCourseDetails.ts
 */

const checkCourseDetails = async () => {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/lms';
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB\n');

        // Find all courses
        const courses = await Course.find({})
            .select('title category level medium grade featuredOnHome _id')
            .sort({ createdAt: -1 })
            .lean();

        console.log('📚 All Courses Details:');
        console.log('='.repeat(100));
        
        if (courses.length === 0) {
            console.log('   No courses found in database');
        } else {
            courses.forEach((course, index) => {
                console.log(`\n${index + 1}. ${course.title}`);
                console.log(`   ID: ${course._id}`);
                console.log(`   Category: ${course.category || 'Not set'}`);
                console.log(`   Grade: ${course.grade || 'Not set'}`);
                console.log(`   Level: ${course.level || 'Not set'}`);
                console.log(`   Medium: ${course.medium || 'Not set'}`);
                console.log(`   Featured: ${course.featuredOnHome ? 'Yes' : 'No'}`);
            });
        }

        console.log('\n' + '='.repeat(100));
        console.log(`Total: ${courses.length} course(s)\n`);

        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

checkCourseDetails();
