import dotenv from 'dotenv';
import { connectDB } from '../config/database';
import { Course } from '../models/Course';

// Load environment variables
dotenv.config();

const deleteCourses = async () => {
    try {
        // Connect to database
        await connectDB();
        console.log('✅ Connected to database');

        // Count existing courses
        const count = await Course.countDocuments();
        console.log(`📊 Found ${count} course(s) in database`);

        if (count === 0) {
            console.log('⚠️  No courses to delete. Database is already empty.');
            process.exit(0);
        }

        // Delete all courses
        const result = await Course.deleteMany({});

        console.log('\n🗑️  All courses deleted!');
        console.log('=====================================');
        console.log(`Deleted ${result.deletedCount} course(s)`);
        console.log('=====================================');
        console.log('\n✅ Database is now clean. You can now run seedCourses.js to add fresh courses.');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error deleting courses:', error);
        process.exit(1);
    }
};

// Run the script
deleteCourses();
