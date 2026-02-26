import mongoose from 'mongoose';
import { Course } from '../models/Course';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Script to hide a specific course from homepage by ID
 * Usage: tsx src/scripts/hideCourseFromHomepage.ts <courseId>
 */

const hideCourseFromHomepage = async (courseId: string) => {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/lms';
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        if (!courseId) {
            console.error('❌ Error: Please provide a course ID');
            console.log('Usage: npm run hide-course <courseId>');
            process.exit(1);
        }

        // Find and update the course
        const course = await Course.findByIdAndUpdate(
            courseId,
            { featuredOnHome: false },
            { new: true }
        );

        if (!course) {
            console.error(`❌ Course not found with ID: ${courseId}`);
            process.exit(1);
        }

        console.log(`✅ Successfully hidden course from homepage:`);
        console.log(`   Title: ${course.title}`);
        console.log(`   ID: ${course._id}`);
        console.log(`   featuredOnHome: ${course.featuredOnHome}`);

        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

const courseId = process.argv[2];
hideCourseFromHomepage(courseId);
