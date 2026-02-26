import mongoose from 'mongoose';
import { Course } from '../models/Course';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Script to list all courses with their featured status
 * Usage: tsx src/scripts/listAllCourses.ts
 */

const listAllCourses = async () => {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/lms';
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB\n');

        // Find all courses
        const courses = await Course.find({})
            .select('title featuredOnHome _id')
            .sort({ createdAt: -1 })
            .lean();

        console.log('📚 All Courses:');
        console.log('='.repeat(80));
        
        const featured = courses.filter(c => c.featuredOnHome);
        const hidden = courses.filter(c => !c.featuredOnHome);

        console.log(`\n✅ FEATURED ON HOMEPAGE (${featured.length}):`);
        console.log('-'.repeat(80));
        if (featured.length === 0) {
            console.log('   No courses are featured on homepage');
        } else {
            featured.forEach((course, index) => {
                console.log(`   ${index + 1}. ${course.title}`);
                console.log(`      ID: ${course._id}`);
            });
        }

        console.log(`\n❌ HIDDEN FROM HOMEPAGE (${hidden.length}):`);
        console.log('-'.repeat(80));
        if (hidden.length === 0) {
            console.log('   All courses are featured');
        } else {
            hidden.forEach((course, index) => {
                console.log(`   ${index + 1}. ${course.title}`);
                console.log(`      ID: ${course._id}`);
            });
        }

        console.log('\n' + '='.repeat(80));
        console.log(`Total: ${courses.length} course(s)\n`);

        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

listAllCourses();
