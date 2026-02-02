import { Router, Response } from 'express';
import { User } from '../models/User';
import { Course } from '../models/Course';
import { Order } from '../models/Order';
import { Enrollment } from '../models/Enrollment';
import { AppError } from '../middleware/error';
import { protect, authorize, AuthRequest } from '../middleware/auth';
import bcrypt from 'bcryptjs';
import { sendNewStudentNotification } from '../utils/emailService';
import { validate } from '../middleware/validate';
import { signupSchema } from '../validators/schemas';

const router = Router();

// Apply admin authorization to all routes
router.use(protect);
router.use(authorize('admin'));

// ==================== USER MANAGEMENT ====================

// @route   GET /api/admin/users
// @desc    Get all users with pagination
// @access  Private (Admin)
router.get('/users', async (req: AuthRequest, res: Response, next) => {
    try {
        const { page = 1, limit = 10, search, role } = req.query;

        const query: any = {};
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }

        // Support multiple roles separated by comma (e.g., "teacher,admin")
        if (role) {
            const roles = (role as string).split(',').map(r => r.trim());
            if (roles.length > 1) {
                query.role = { $in: roles };
            } else {
                query.role = role;
            }
        }

        const users = await User.find(query)
            .select('-password')
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit))
            .sort({ createdAt: -1 })
            .lean();

        // Fetch enrollments for each user
        const usersWithEnrollments = await Promise.all(
            users.map(async (user: any) => {
                const enrollments = await Enrollment.find({
                    userId: user._id,
                    status: 'paid'
                })
                    .populate('courseId', 'title')
                    .select('courseId enrolledAt')
                    .lean();

                return {
                    ...user,
                    enrollments: enrollments.map((e: any) => ({
                        courseName: e.courseId?.title || 'Unknown Course',
                        enrolledAt: e.enrolledAt
                    }))
                };
            })
        );

        const total = await User.countDocuments(query);

        res.status(200).json({
            success: true,
            count: usersWithEnrollments.length,
            total,
            pages: Math.ceil(total / Number(limit)),
            data: usersWithEnrollments,
        });
    } catch (error) {
        next(error);
    }
});

// @route   PUT /api/admin/users/:id
// @desc    Update user details
// @access  Private (Admin)
router.put('/users/:id', async (req: AuthRequest, res: Response, next) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            throw new AppError('User not found', 404);
        }

        res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error) {
        next(error);
    }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user
// @access  Private (Admin)
router.delete('/users/:id', async (req: AuthRequest, res: Response, next) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            throw new AppError('User not found', 404);
        }

        await user.deleteOne();

        res.status(200).json({
            success: true,
            message: 'User deleted successfully',
        });
    } catch (error) {
        next(error);
    }
});

// @route   POST /api/admin/users/create-student
// @desc    Create a new student account
// @access  Private (Admin)
router.post('/users/create-student', validate(signupSchema), async (req: AuthRequest, res: Response, next) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            throw new AppError('Name, email, and password are required', 400);
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new AppError('A user with this email already exists', 400);
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new student
        const student = await User.create({
            name,
            email,
            password: hashedPassword,
            role: 'student',
        });

        console.log(`✅ Admin created student account: ${student.email}`);

        // Send email notification to admin
        try {
            await sendNewStudentNotification(
                student.name,
                student.email,
                req.user?.email || 'Admin'
            );
        } catch (emailError) {
            console.error('Failed to send notification email:', emailError);
            // Continue even if email fails
        }

        // Create in-app notification for all admins
        try {
            const { Notification } = await import('../models/Notification');
            const adminUsers = await User.find({ role: 'admin' });

            // Create notification for each admin
            const notificationPromises = adminUsers.map(admin =>
                Notification.create({
                    userId: admin._id,
                    title: '🎓 New Student Account Created',
                    message: `${student.name} (${student.email}) has been added to the platform.`,
                    type: 'success',
                    link: '/admin/students',
                })
            );

            await Promise.all(notificationPromises);
            console.log(`📬 Created notifications for ${adminUsers.length} admin(s)`);
        } catch (notificationError) {
            console.error('Failed to create in-app notification:', notificationError);
            // Continue even if notification fails
        }

        res.status(201).json({
            success: true,
            message: `Student account created successfully for ${name}`,
            data: {
                _id: student._id,
                name: student.name,
                email: student.email,
                role: student.role,
            },
        });
    } catch (error) {
        next(error);
    }
});

// ==================== ANALYTICS ====================

// @route   GET /api/admin/analytics/overview
// @desc    Get dashboard overview stats
// @access  Private (Admin)
router.get('/analytics/overview', async (req: AuthRequest, res: Response, next) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalCourses = await Course.countDocuments();
        const totalOrders = await Order.countDocuments();

        // Calculate revenue
        const orders = await Order.find({ status: { $ne: 'cancelled' } });
        const totalRevenue = orders.reduce((sum: number, order: any) => sum + order.totalAmount, 0);

        // Get recent activity
        const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5).select('name email createdAt');
        const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5).populate('userId', 'name email');

        // Revenue data by month (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const recentOrders2 = await Order.find({
            createdAt: { $gte: sixMonthsAgo },
            status: { $ne: 'cancelled' },
        });

        const revenueByMonth: any = {};
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        recentOrders2.forEach((order: any) => {
            const monthIndex = order.createdAt.getMonth();
            const month = months[monthIndex];
            if (!revenueByMonth[month]) {
                revenueByMonth[month] = 0;
            }
            revenueByMonth[month] += order.totalAmount;
        });

        const revenueData = Object.keys(revenueByMonth).map((month) => ({
            month,
            revenue: revenueByMonth[month],
        }));

        // Popular courses data
        const courses = await Course.find().select('title studentsEnrolled').limit(5).sort({ studentsEnrolled: -1 });
        const courseData = courses.map((course: any) => ({
            name: course.title.length > 20 ? course.title.substring(0, 20) + '...' : course.title,
            students: course.studentsEnrolled || 0,
        }));

        // Category distribution data
        const categoryCounts: any = {};
        const allCourses = await Course.find().select('category');
        allCourses.forEach((course: any) => {
            const category = course.category || 'Uncategorized';
            categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        });

        const categoryData = Object.keys(categoryCounts).map((name) => ({
            name,
            value: categoryCounts[name],
        }));

        res.status(200).json({
            success: true,
            data: {
                stats: {
                    totalUsers,
                    totalCourses,
                    totalOrders,
                    totalRevenue,
                },
                recentUsers,
                recentOrders,
                revenueData,
                courseData,
                categoryData,
            },
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/admin/analytics/revenue
// @desc    Get revenue data for charts
// @access  Private (Admin)
router.get('/analytics/revenue', async (req: AuthRequest, res: Response, next) => {
    try {
        const { period = 'month' } = req.query;

        // Get orders from last 6 months
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const orders = await Order.find({
            createdAt: { $gte: sixMonthsAgo },
            status: { $ne: 'cancelled' },
        });

        // Group by month
        const revenueByMonth: any = {};
        orders.forEach((order: any) => {
            const month = order.createdAt.toLocaleString('default', { month: 'short' });
            if (!revenueByMonth[month]) {
                revenueByMonth[month] = 0;
            }
            revenueByMonth[month] += order.totalAmount;
        });

        const data = Object.keys(revenueByMonth).map((month) => ({
            month,
            revenue: revenueByMonth[month],
        }));

        res.status(200).json({
            success: true,
            data,
        });
    } catch (error) {
        next(error);
    }
});

// ==================== ORDER MANAGEMENT ====================

// @route   GET /api/admin/orders
// @desc    Get all orders
// @access  Private (Admin)
router.get('/orders', async (req: AuthRequest, res: Response, next) => {
    try {
        const { page = 1, limit = 10, status, search } = req.query;

        const query: any = {};
        if (status) query.status = status;
        if (search) query.orderId = { $regex: search, $options: 'i' };

        const orders = await Order.find(query)
            .populate('userId', 'name email')
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit))
            .sort({ createdAt: -1 });

        const total = await Order.countDocuments(query);

        res.status(200).json({
            success: true,
            count: orders.length,
            total,
            pages: Math.ceil(total / Number(limit)),
            data: orders,
        });
    } catch (error) {
        next(error);
    }
});

// @route   PUT /api/admin/orders/:id/status
// @desc    Update order status
// @access  Private (Admin)
router.put('/orders/:id/status', async (req: AuthRequest, res: Response, next) => {
    try {
        const { status } = req.body;

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        ).populate('userId', 'name email');

        if (!order) {
            throw new AppError('Order not found', 404);
        }

        res.status(200).json({
            success: true,
            data: order,
        });
    } catch (error) {
        next(error);
    }
});

// ==================== PRODUCT MANAGEMENT ====================

// ==================== ENROLLMENT MANAGEMENT ====================

// @route   POST /api/admin/enroll-student
// @desc    Manually enroll a student in a course
// @access  Private (Admin)
router.post('/enroll-student', async (req: AuthRequest, res: Response, next) => {
    try {
        const { studentEmail, courseId } = req.body;

        if (!studentEmail || !courseId) {
            throw new AppError('Student email and course ID are required', 400);
        }

        // Find student by email
        const student = await User.findOne({ email: studentEmail });
        if (!student) {
            throw new AppError('Student not found with this email', 404);
        }

        // Find course
        const course = await Course.findById(courseId);
        if (!course) {
            throw new AppError('Course not found', 404);
        }

        // Check if already enrolled
        const existingEnrollment = await Enrollment.findOne({
            userId: student._id,
            courseId: courseId,
        });

        if (existingEnrollment) {
            return res.status(200).json({
                success: true,
                message: 'Student is already enrolled in this course',
                data: existingEnrollment,
            });
        }

        // Create enrollment
        const enrollment = await Enrollment.create({
            userId: student._id,
            courseId: courseId,
            status: 'paid', // Free access granted by admin
            completionPercentage: 0,
            purchaseDate: new Date(),
        });

        // Add course to user's enrolled courses
        if (!student.enrolledCourses) {
            student.enrolledCourses = [];
        }
        if (!student.enrolledCourses.includes(courseId as any)) {
            student.enrolledCourses.push(courseId as any);
            await student.save();
        }

        console.log(`✅ Admin enrolled student ${student.email} in course ${course.title}`);

        res.status(201).json({
            success: true,
            message: `Successfully enrolled ${student.name} in ${course.title}`,
            data: enrollment,
        });
    } catch (error) {
        next(error);
    }
});

export default router;
