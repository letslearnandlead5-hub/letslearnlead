import mongoose from 'mongoose';
import { Course } from '../models/Course';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query: string): Promise<string> => {
    return new Promise(resolve => rl.question(query, resolve));
};

const fixFeaturedCourses = async () => {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/lms';
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        // Find all courses
        const allCourses = await Course.find({})
            .select('title featuredOnHome')
            .lean();

        console.log('\n📊 All Courses:');
        console.log('=====================================');
        allCourses.forEach((course, index) => {
            const status = course.featuredOnHome ? '✅ FEATURED' : '❌ HIDDEN';
            console.log(`${index + 1}. ${course.title} - ${status} (ID: ${course._id})`);
        });

        console.log('\n');
        const action = await question('What would you like to do?\n1. Hide all courses from homepage\n2. Feature specific course(s)\n3. Hide specific course(s)\n4. Exit\nEnter choice (1-4): ');

        switch (action.trim()) {
            case '1':
                const confirmHideAll = await question('Are you sure you want to hide ALL courses from homepage? (yes/no): ');
                if (confirmHideAll.toLowerCase() === 'yes') {
                    const result = await Course.updateMany({}, { featuredOnHome: false });
                    console.log(`✅ Updated ${result.modifiedCount} course(s). All courses are now hidden from homepage.`);
                }
                break;

            case '2':
                const featureIds = await question('Enter course IDs to feature (comma-separated): ');
                const idsToFeature = featureIds.split(',').map(id => id.trim());
                for (const id of idsToFeature) {
                    try {
                        await Course.findByIdAndUpdate(id, { featuredOnHome: true });
                        console.log(`✅ Featured course: ${id}`);
                    } catch (err) {
                        console.log(`❌ Failed to feature course: ${id}`);
                    }
                }
                break;

            case '3':
                const hideIds = await question('Enter course IDs to hide (comma-separated): ');
                const idsToHide = hideIds.split(',').map(id => id.trim());
                for (const id of idsToHide) {
                    try {
                        await Course.findByIdAndUpdate(id, { featuredOnHome: false });
                        console.log(`✅ Hidden course: ${id}`);
                    } catch (err) {
                        console.log(`❌ Failed to hide course: ${id}`);
                    }
                }
                break;

            case '4':
                console.log('Exiting...');
                break;

            default:
                console.log('Invalid choice');
        }

        rl.close();
        await mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
    } catch (error) {
        console.error('❌ Error:', error);
        rl.close();
        process.exit(1);
    }
};

fixFeaturedCourses();
