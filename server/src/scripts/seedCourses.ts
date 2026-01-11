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
        level: 'Beginner',
        duration: 240, // 240 minutes = 4 hours
        lessons: 45,
        studentsEnrolled: 0,
        rating: 4.8,
        syllabus: [
            {
                title: 'Introduction to Web Development',
                topics: [
                    'What is Web Development?',
                    'Setting up your development environment',
                    'Understanding how the web works',
                    'Your first HTML page'
                ]
            },
            {
                title: 'HTML & CSS Fundamentals',
                topics: [
                    'HTML tags and structure',
                    'CSS styling basics',
                    'Flexbox and Grid layouts',
                    'Responsive design principles'
                ]
            },
            {
                title: 'JavaScript Essentials',
                topics: [
                    'Variables and data types',
                    'Functions and control flow',
                    'DOM manipulation',
                    'Event handling'
                ]
            },
            {
                title: 'React for Beginners',
                topics: [
                    'Introduction to React',
                    'Components and Props',
                    'State and Hooks',
                    'Building your first React app'
                ]
            }
        ],
        videos: [
            {
                title: 'Course Introduction',
                url: 'https://www.youtube.com/watch?v=example1',
                duration: 15
            },
            {
                title: 'Setting Up Development Environment',
                url: 'https://www.youtube.com/watch?v=example2',
                duration: 30
            }
        ]
    },
    {
        title: 'Data Science with Python',
        description: 'Learn data analysis, visualization, and machine learning using Python. Perfect for beginners interested in data science and AI.',
        instructor: 'Admin',
        category: 'Data Science',
        price: 999, // Paid course
        thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800',
        level: 'Intermediate',
        duration: 360, // 360 minutes = 6 hours
        lessons: 60,
        studentsEnrolled: 0,
        rating: 4.9,
        syllabus: [
            {
                title: 'Python Basics for Data Science',
                topics: [
                    'Python installation and setup',
                    'Python syntax and fundamentals',
                    'NumPy and Pandas introduction',
                    'Working with data structures'
                ]
            },
            {
                title: 'Data Analysis and Visualization',
                topics: [
                    'Exploratory Data Analysis (EDA)',
                    'Matplotlib and Seaborn',
                    'Creating interactive visualizations',
                    'Statistical analysis basics'
                ]
            },
            {
                title: 'Machine Learning Fundamentals',
                topics: [
                    'Introduction to ML concepts',
                    'Supervised vs Unsupervised learning',
                    'Linear and Logistic Regression',
                    'Model evaluation techniques'
                ]
            },
            {
                title: 'Real-World Projects',
                topics: [
                    'Building a prediction model',
                    'Data preprocessing pipeline',
                    'Deploying ML models',
                    'Best practices and tips'
                ]
            }
        ],
        videos: [
            {
                title: 'Welcome to Data Science',
                url: 'https://www.youtube.com/watch?v=example3',
                duration: 20
            },
            {
                title: 'Python Setup for Data Science',
                url: 'https://www.youtube.com/watch?v=example4',
                duration: 25
            }
        ]
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
