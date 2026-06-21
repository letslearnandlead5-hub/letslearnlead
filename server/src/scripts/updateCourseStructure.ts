import mongoose from 'mongoose';
import { Course } from '../models/Course';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Script to update course structure - move "9th Standard" from category to grade
 * and set proper category (science)
 * Usage: npx tsx src/scripts/updateCourseStructure.ts
 */

const updateCourseStructure = async () => {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/lms';
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB\n');

        // Find the course with category "9th Standard"
        const course = await Course.findOne({ category: '9th Standard' });

        if (!course) {
            console.log('❌ No course found with category "9th Standard"');
            await mongoose.disconnect();
            return;
        }

        console.log('📚 Found course:', course.title);
        console.log('   Current Category:', course.category);
        console.log('   Current Grade:', course.grade || 'Not set');

        // Update the course
        // Since the title is in Kannada and mentions "ವಿಜ್ಞಾನ" (Science), set category to science
        course.category = 'science';
        course.grade = '9th';
        
        await course.save();

        console.log('\n✅ Updated course:');
        console.log('   New Category:', course.category);
        console.log('   New Grade:', course.grade);
        console.log('\n✨ Course structure updated successfully!');

        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

updateCourseStructure();
