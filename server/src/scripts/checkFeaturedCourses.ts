import mongoose from 'mongoose';
import { Course } from '../models/Course';
import dotenv from 'dotenv';

dotenv.config();

const checkFeaturedCourses = async () => {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/lms';
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        // Find all courses with featuredOnHome = true
        const featuredCourses = await Course.find({ featuredOnHome: true })
            .select('title featuredOnHome')
            .lean();

        console.log('\n📊 Courses with featuredOnHome = true:');
        console.log('=====================================');
        
        if (featuredCourses.length === 0) {
            console.log('No courses are currently featured on homepage.');
        } else {
            featuredCourses.forEach((course, index) => {
                console.log(`${index + 1}. ${course.title} (ID: ${course._id})`);
            });
        }

        console.log(`\nTotal: ${featuredCourses.length} course(s)`);

        // Find all courses with featuredOnHome = false or undefined
        const hiddenCourses = await Course.find({
            $or: [
                { featuredOnHome: false },
                { featuredOnHome: { $exists: false } }
            ]
        })
            .select('title featuredOnHome')
            .lean();

        console.log('\n📊 Courses hidden from homepage:');
        console.log('=====================================');
        
        if (hiddenCourses.length === 0) {
            console.log('All courses are featured on homepage.');
        } else {
            hiddenCourses.forEach((course, index) => {
                console.log(`${index + 1}. ${course.title} (ID: ${course._id}) - featuredOnHome: ${course.featuredOnHome}`);
            });
        }

        console.log(`\nTotal: ${hiddenCourses.length} course(s)`);

        await mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

checkFeaturedCourses();
