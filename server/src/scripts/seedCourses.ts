import dotenv from 'dotenv';
import { connectDB } from '../config/database';
import { Course } from '../models/Course';

// Load environment variables
dotenv.config();

const sampleCourses = [
    {
        title: 'Complete Web Development Bootcamp',
        description: 'Master modern web development from scratch. Learn HTML, CSS, JavaScript, React, Node.js, and MongoDB to build full-stack applications.',
        instructor: 'Admin',
        category: 'Web Development',
        price: 0, // Free course
        thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800',
        level: 'beginner', // lowercase as per enum
        duration: '4h 30m', // string format
        studentsEnrolled: 0,
        rating: 4.8,
        lessons: [
            {
                title: 'Course Introduction',
                description: 'Welcome to the course! Learn what you will build.',
                videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                duration: '15:00',
                order: 0
            },
            {
                title: 'Setting Up Development Environment',
                description: 'Install VS Code, Node.js, and other essential tools.',
                videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                duration: '30:00',
                order: 1
            },
            {
                title: 'HTML Basics',
                description: 'Learn HTML tags, structure, and semantic HTML.',
                videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                duration: '45:00',
                order: 2
            }
        ],
        demoVideoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
    },
    {
        title: 'Data Science with Python',
        description: 'Learn data analysis, visualization, and machine learning using Python. Perfect for beginners interested in data science and AI.',
        instructor: 'Admin',
        category: 'Data Science',
        price: 999, // Paid course
        thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800',
        level: 'intermediate', // lowercase
        duration: '6h 15m', // string format
        studentsEnrolled: 0,
        rating: 4.9,
        lessons: [
            {
                title: 'Welcome to Data Science',
                description: 'Introduction to the exciting world of data science and AI.',
                videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                duration: '20:00',
                order: 0
            },
            {
                title: 'Python Setup for Data Science',
                description: 'Install Python, Anaconda, and Jupyter Notebooks.',
                videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                duration: '25:00',
                order: 1
            },
            {
                title: 'NumPy Fundamentals',
                description: 'Master NumPy arrays and mathematical operations.',
                videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                duration: '40:00',
                order: 2
            },
            {
                title: 'Pandas for Data Analysis',
                description: 'Learn to manipulate and analyze data with Pandas.',
                videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                duration: '50:00',
                order: 3
            }
        ],
        demoVideoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
    }
];

const seedCourses = async () => {
    try {
        // Connect to database
        await connectDB();
        console.log('✅ Connected to database');

        // Check if courses already exist
        const existingCourses = await Course.countDocuments();

        if (existingCourses > 0) {
            console.log(`⚠️  Database already has ${existingCourses} course(s).`);
            console.log('Do you want to add more courses? (This will NOT delete existing ones)');
            console.log('\nTo reset and start fresh, delete all courses first from the database.');
        }

        // Insert sample courses
        const createdCourses = await Course.insertMany(sampleCourses);

        console.log('\n🎉 Sample courses created successfully!');
        console.log('=====================================');
        createdCourses.forEach((course, index) => {
            console.log(`\n${index + 1}. ${course.title}`);
            console.log(`   Category: ${course.category}`);
            console.log(`   Level: ${course.level}`);
            console.log(`   Price: ${course.price === 0 ? 'FREE' : `₹${course.price}`}`);
            console.log(`   Lessons: ${course.lessons}`);
            console.log(`   Duration: ${course.duration} minutes`);
        });
        console.log('\n=====================================');
        console.log(`\n✅ Total courses in database: ${await Course.countDocuments()}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating courses:', error);
        process.exit(1);
    }
};

// Run the script
seedCourses();
