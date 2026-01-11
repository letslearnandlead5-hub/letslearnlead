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
        sections: [
            {
                title: 'Getting Started with Web Development',
                description: 'Learn the fundamentals of web development',
                order: 0,
                subsections: [
                    {
                        title: 'HTML Fundamentals',
                        description: 'Master HTML from scratch',
                        order: 0,
                        content: [
                            {
                                type: 'video',
                                title: 'HTML Tutorial for Beginners',
                                description: 'Learn HTML basics: structure, tags, and how to create your first webpage.',
                                videoUrl: 'https://www.youtube.com/embed/qz0aGYrrlhU',
                                duration: '41:00',
                                order: 0,
                                isFree: true
                            }
                        ]
                    },
                    {
                        title: 'CSS Styling',
                        description: 'Style your web pages beautifully',
                        order: 1,
                        content: [
                            {
                                type: 'video',
                                title: 'CSS Tutorial - Zero to Hero',
                                description: 'Master CSS from basics to advanced styling techniques.',
                                videoUrl: 'https://www.youtube.com/embed/1Rs2ND1ryYc',
                                duration: '92:00',
                                order: 0,
                                isFree: false
                            }
                        ]
                    }
                ]
            },
            {
                title: 'JavaScript and Modern Frameworks',
                description: 'Build interactive web applications',
                order: 1,
                subsections: [
                    {
                        title: 'JavaScript Essentials',
                        description: 'Learn JavaScript programming',
                        order: 0,
                        content: [
                            {
                                type: 'video',
                                title: 'JavaScript Programming - Full Course',
                                description: 'Complete JavaScript tutorial covering fundamentals to advanced concepts.',
                                videoUrl: 'https://www.youtube.com/embed/PkZNo7MFNFg',
                                duration: '134:00',
                                order: 0,
                                isFree: false
                            }
                        ]
                    },
                    {
                        title: 'React Framework',
                        description: 'Build modern UIs with React',
                        order: 1,
                        content: [
                            {
                                type: 'video',
                                title: 'React Tutorial for Beginners',
                                description: 'Learn React.js from scratch and build modern web applications.',
                                videoUrl: 'https://www.youtube.com/embed/SqcY0GlETPk',
                                duration: '143:00',
                                order: 0,
                                isFree: false
                            }
                        ]
                    }
                ]
            }
        ],
        lessons: [
            {
                title: 'HTML Tutorial for Beginners',
                description: 'Learn HTML basics: structure, tags, and how to create your first webpage.',
                videoUrl: 'https://www.youtube.com/embed/qz0aGYrrlhU',
                duration: '41:00',
                order: 0
            },
            {
                title: 'CSS Tutorial - Zero to Hero',
                description: 'Master CSS from basics to advanced styling techniques.',
                videoUrl: 'https://www.youtube.com/embed/1Rs2ND1ryYc',
                duration: '92:00',
                order: 1
            },
            {
                title: 'JavaScript Programming - Full Course',
                description: 'Complete JavaScript tutorial covering fundamentals to advanced concepts.',
                videoUrl: 'https://www.youtube.com/embed/PkZNo7MFNFg',
                duration: '134:00',
                order: 2
            },
            {
                title: 'React Tutorial for Beginners',
                description: 'Learn React.js from scratch and build modern web applications.',
                videoUrl: 'https://www.youtube.com/embed/SqcY0GlETPk',
                duration: '143:00',
                order: 3
            }
        ],
        demoVideoUrl: 'https://www.youtube.com/embed/qz0aGYrrlhU'
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
        sections: [
            {
                title: 'Python Programming Fundamentals',
                description: 'Master Python programming for data science',
                order: 0,
                subsections: [
                    {
                        title: 'Python Basics',
                        description: 'Learn Python from scratch',
                        order: 0,
                        content: [
                            {
                                type: 'video',
                                title: 'Python for Beginners - Full Course',
                                description: 'Complete Python programming tutorial for data science beginners.',
                                videoUrl: 'https://www.youtube.com/embed/rfscVS0vtbw',
                                duration: '270:00',
                                order: 0,
                                isFree: true
                            }
                        ]
                    }
                ]
            },
            {
                title: 'Data Analysis Libraries',
                description: 'Master essential data science libraries',
                order: 1,
                subsections: [
                    {
                        title: 'Pandas Library',
                        description: 'Data manipulation and analysis',
                        order: 0,
                        content: [
                            {
                                type: 'video',
                                title: 'Pandas Tutorial - Data Analysis',
                                description: 'Learn Pandas library for powerful data manipulation and analysis.',
                                videoUrl: 'https://www.youtube.com/embed/vmEHCJofslg',
                                duration: '60:00',
                                order: 0,
                                isFree: false
                            }
                        ]
                    },
                    {
                        title: 'NumPy Arrays',
                        description: 'Numerical computing with NumPy',
                        order: 1,
                        content: [
                            {
                                type: 'video',
                                title: 'NumPy Tutorial for Beginners',
                                description: 'Master NumPy - the fundamental package for scientific computing.',
                                videoUrl: 'https://www.youtube.com/embed/QUT1VHiLmmI',
                                duration: '58:00',
                                order: 0,
                                isFree: false
                            }
                        ]
                    }
                ]
            },
            {
                title: 'Machine Learning and Visualization',
                description: 'Build ML models and create visualizations',
                order: 2,
                subsections: [
                    {
                        title: 'Machine Learning Basics',
                        description: 'Introduction to ML algorithms',
                        order: 0,
                        content: [
                            {
                                type: 'video',
                                title: 'Machine Learning Tutorial',
                                description: 'Introduction to Machine Learning with Python and Scikit-learn.',
                                videoUrl: 'https://www.youtube.com/embed/7eh4d6sabA0',
                                duration: '50:00',
                                order: 0,
                                isFree: false
                            }
                        ]
                    },
                    {
                        title: 'Data Visualization',
                        description: 'Create stunning charts and graphs',
                        order: 1,
                        content: [
                            {
                                type: 'video',
                                title: 'Data Visualization with Matplotlib',
                                description: 'Create stunning data visualizations using Matplotlib and Seaborn.',
                                videoUrl: 'https://www.youtube.com/embed/3Xc3CA655Y4',
                                duration: '120:00',
                                order: 0,
                                isFree: false
                            }
                        ]
                    }
                ]
            }
        ],
        lessons: [
            {
                title: 'Python for Beginners - Full Course',
                description: 'Complete Python programming tutorial for data science beginners.',
                videoUrl: 'https://www.youtube.com/embed/rfscVS0vtbw',
                duration: '270:00',
                order: 0
            },
            {
                title: 'Pandas Tutorial - Data Analysis',
                description: 'Learn Pandas library for powerful data manipulation and analysis.',
                videoUrl: 'https://www.youtube.com/embed/vmEHCJofslg',
                duration: '60:00',
                order: 1
            },
            {
                title: 'NumPy Tutorial for Beginners',
                description: 'Master NumPy - the fundamental package for scientific computing.',
                videoUrl: 'https://www.youtube.com/embed/QUT1VHiLmmI',
                duration: '58:00',
                order: 2
            },
            {
                title: 'Machine Learning Tutorial',
                description: 'Introduction to Machine Learning with Python and Scikit-learn.',
                videoUrl: 'https://www.youtube.com/embed/7eh4d6sabA0',
                duration: '50:00',
                order: 3
            },
            {
                title: 'Data Visualization with Matplotlib',
                description: 'Create stunning data visualizations using Matplotlib and Seaborn.',
                videoUrl: 'https://www.youtube.com/embed/3Xc3CA655Y4',
                duration: '120:00',
                order: 4
            }
        ],
        demoVideoUrl: 'https://www.youtube.com/embed/rfscVS0vtbw'
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
