import type { Course, Product, Note } from '../types';

// Mock Courses Data
export const mockCourses: Course[] = [
    {
        id: '1',
        title: 'Complete Web Development Bootcamp',
        description: 'Learn HTML, CSS, JavaScript, React, Node.js, and more in this comprehensive course.',
        thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800',
        instructor: 'John Smith',
        price: 2999,
        originalPrice: 4999,
        rating: 4.8,
        studentsEnrolled: 15420,
        duration: '45 hours',
        level: 'Beginner',
        category: 'Web Development',
        lessons: [
            { id: '1-1', title: 'Introduction to Web Development', duration: '15:30', isCompleted: false, isLocked: false },
            { id: '1-2', title: 'HTML Fundamentals', duration: '45:20', isCompleted: false, isLocked: false },
            { id: '1-3', title: 'CSS Styling', duration: '60:10', isCompleted: false, isLocked: true },
        ],
        curriculum: [
            {
                id: 'sec-1',
                title: 'Getting Started',
                lessons: [
                    { id: '1-1', title: 'Introduction', duration: '15:30', isCompleted: false, isLocked: false },
                    { id: '1-2', title: 'Setup Development Environment', duration: '20:15', isCompleted: false, isLocked: false },
                ],
            },
        ],
    },
    {
        id: '2',
        title: 'Python for Data Science',
        description: 'Master Python programming and data analysis with Pandas, NumPy, and Matplotlib.',
        thumbnail: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800',
        instructor: 'Sarah Johnson',
        price: 3499,
        originalPrice: 5999,
        rating: 4.9,
        studentsEnrolled: 12300,
        duration: '38 hours',
        level: 'Intermediate',
        category: 'Data Science',
        lessons: [],
        curriculum: [],
    },
    {
        id: '3',
        title: 'Mobile App Development with React Native',
        description: 'Build cross-platform mobile apps for iOS and Android using React Native.',
        thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800',
        instructor: 'Mike Chen',
        price: 3999,
        originalPrice: 6999,
        rating: 4.7,
        studentsEnrolled: 8900,
        duration: '52 hours',
        level: 'Advanced',
        category: 'Mobile Development',
        lessons: [],
        curriculum: [],
    },
    {
        id: '4',
        title: 'Digital Marketing Masterclass',
        description: 'Learn SEO, Social Media Marketing, Email Marketing, and Analytics.',
        thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
        instructor: 'Emily Davis',
        price: 2499,
        originalPrice: 4499,
        rating: 4.6,
        studentsEnrolled: 10500,
        duration: '35 hours',
        level: 'Beginner',
        category: 'Marketing',
        lessons: [],
        curriculum: [],
    },
];

// Mock Products Data
export const mockProducts: Product[] = [
    {
        id: '1',
        name: 'Premium Programming Bundle',
        description: 'Complete collection of programming books and resources.',
        price: 1999,
        originalPrice: 2999,
        images: [
            'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800',
            'https://images.unsplash.com/photo-1589998059171-988d887df646?w=800',
        ],
        category: 'Books',
        stock: 50,
        rating: 4.8,
        reviews: [],
    },
    {
        id: '2',
        name: 'Wireless Noise-Canceling Headphones',
        description: 'Perfect for focused studying and online classes.',
        price: 4999,
        originalPrice: 7999,
        images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'],
        category: 'Electronics',
        stock: 25,
        rating: 4.9,
        reviews: [],
    },
    {
        id: '3',
        name: 'Ergonomic Study Desk',
        description: 'Height-adjustable desk for comfortable learning sessions.',
        price: 12999,
        originalPrice: 15999,
        images: ['https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800'],
        category: 'Furniture',
        stock: 15,
        rating: 4.7,
        reviews: [],
    },
];

// Mock Notes Data
export const mockNotes: Note[] = [
    {
        id: '1',
        title: 'Web Development Notes',
        courseId: '1',
        fileName: 'web-dev-notes.pdf',
        fileUrl: '#',
        fileSize: '2.5 MB',
        uploadedAt: new Date('2024-01-15'),
    },
    {
        id: '2',
        title: 'Python Basics',
        courseId: '2',
        fileName: 'python-basics.pdf',
        fileUrl: '#',
        fileSize: '1.8 MB',
        uploadedAt: new Date('2024-01-20'),
    },
];

// Mock API functions
export const fetchCourses = (): Promise<Course[]> => {
    return new Promise((resolve) => {
        setTimeout(() => resolve(mockCourses), 500);
    });
};

export const fetchCourseById = (id: string): Promise<Course | undefined> => {
    return new Promise((resolve) => {
        setTimeout(() => resolve(mockCourses.find((c) => c.id === id)), 500);
    });
};

export const fetchProducts = (): Promise<Product[]> => {
    return new Promise((resolve) => {
        setTimeout(() => resolve(mockProducts), 500);
    });
};

export const fetchProductById = (id: string): Promise<Product | undefined> => {
    return new Promise((resolve) => {
        setTimeout(() => resolve(mockProducts.find((p) => p.id === id)), 500);
    });
};
