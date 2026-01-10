import { Router, Response } from 'express';
import { Doubt } from '../models/Doubt';
import { Notification } from '../models/Notification';
import { User } from '../models/User';
import { Course } from '../models/Course';
import { protect, AuthRequest, adminOnly } from '../middleware/auth';
import { AppError } from '../middleware/error';

const router = Router();

// ============================================
// STUDENT ENDPOINTS
// ============================================

// @route   GET /api/doubts
// @desc    Get student's own doubts with filtering
// @access  Private (Student)
router.get('/', protect, async (req: AuthRequest, res: Response, next) => {
    try {
        const { status, courseId, category, limit = 20, page = 1 } = req.query;

        const filter: any = { studentId: req.user._id };

        if (status) filter.status = status;
        if (courseId) filter.courseId = courseId;
        if (category) filter.category = category;

        const skip = (Number(page) - 1) * Number(limit);

        const doubts = await Doubt.find(filter)
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .skip(skip)
            .populate('courseId', 'title')
            .populate('respondedBy', 'name');

        const total = await Doubt.countDocuments(filter);

        res.status(200).json({
            success: true,
            count: doubts.length,
            total,
            page: Number(page),
            pages: Math.ceil(total / Number(limit)),
            data: doubts,
        });
    } catch (error) {
        next(error);
    }
});

// @route   POST /api/doubts
// @desc    Submit a new doubt
// @access  Private (Student)
router.post('/', protect, async (req: AuthRequest, res: Response, next) => {
    try {
        const { subject, description, courseId, courseName, category, priority } = req.body;

        if (!subject || !description) {
            throw new AppError('Subject and description are required', 400);
        }

        const doubt = await Doubt.create({
            studentId: req.user._id,
            studentName: req.user.name,
            subject,
            description,
            courseId,
            courseName,
            category: category || 'general',
            priority: priority || 'medium',
        });

        // Notify admins about new doubt
        const admins = await User.find({ role: 'admin' });
        const notifications = admins.map(admin => ({
            userId: admin._id,
            title: 'New Student Doubt',
            message: `${req.user.name} raised a doubt: "${subject}"`,
            type: 'info' as const,
            link: `/admin/doubts`,
        }));

        await Notification.insertMany(notifications);

        res.status(201).json({
            success: true,
            message: 'Doubt submitted successfully',
            data: doubt,
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/doubts/:id
// @desc    Get specific doubt details
// @access  Private (Student - own doubts only)
router.get('/:id', protect, async (req: AuthRequest, res: Response, next) => {
    try {
        const doubt = await Doubt.findById(req.params.id)
            .populate('courseId', 'title')
            .populate('respondedBy', 'name email');

        if (!doubt) {
            throw new AppError('Doubt not found', 404);
        }

        // Check if doubt belongs to user (unless admin)
        if (req.user.role !== 'admin' && doubt.studentId.toString() !== req.user._id.toString()) {
            throw new AppError('Not authorized to view this doubt', 403);
        }

        res.status(200).json({
            success: true,
            data: doubt,
        });
    } catch (error) {
        next(error);
    }
});

// @route   PUT /api/doubts/:id
// @desc    Update doubt (only if not yet responded)
// @access  Private (Student - own doubts only)
router.put('/:id', protect, async (req: AuthRequest, res: Response, next) => {
    try {
        const doubt = await Doubt.findById(req.params.id);

        if (!doubt) {
            throw new AppError('Doubt not found', 404);
        }

        // Check if doubt belongs to user
        if (doubt.studentId.toString() !== req.user._id.toString()) {
            throw new AppError('Not authorized to update this doubt', 403);
        }

        // Don't allow updates if already responded
        if (doubt.response) {
            throw new AppError('Cannot update doubt that has been responded to', 400);
        }

        const { subject, description, category, priority } = req.body;

        if (subject) doubt.subject = subject;
        if (description) doubt.description = description;
        if (category) doubt.category = category;
        if (priority) doubt.priority = priority;

        await doubt.save();

        res.status(200).json({
            success: true,
            message: 'Doubt updated successfully',
            data: doubt,
        });
    } catch (error) {
        next(error);
    }
});

// @route   DELETE /api/doubts/:id
// @desc    Delete own doubt (only if not responded)
// @access  Private (Student)
router.delete('/:id', protect, async (req: AuthRequest, res: Response, next) => {
    try {
        const doubt = await Doubt.findById(req.params.id);

        if (!doubt) {
            throw new AppError('Doubt not found', 404);
        }

        // Check if doubt belongs to user
        if (doubt.studentId.toString() !== req.user._id.toString()) {
            throw new AppError('Not authorized to delete this doubt', 403);
        }

        // Don't allow deletion if already responded
        if (doubt.response) {
            throw new AppError('Cannot delete doubt that has been responded to', 400);
        }

        await doubt.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Doubt deleted successfully',
        });
    } catch (error) {
        next(error);
    }
});

// ============================================
// ADMIN ENDPOINTS
// ============================================

// @route   GET /api/doubts/admin/all
// @desc    Get all doubts with filters (admin only)
// @access  Private (Admin)
router.get('/admin/all', protect, adminOnly, async (req: AuthRequest, res: Response, next) => {
    try {
        const { status, courseId, category, priority, studentId, search, limit = 20, page = 1 } = req.query;

        const filter: any = {};

        if (status) filter.status = status;
        if (courseId) filter.courseId = courseId;
        if (category) filter.category = category;
        if (priority) filter.priority = priority;
        if (studentId) filter.studentId = studentId;
        if (search) {
            filter.$or = [
                { subject: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { studentName: { $regex: search, $options: 'i' } },
            ];
        }

        const skip = (Number(page) - 1) * Number(limit);

        const doubts = await Doubt.find(filter)
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .skip(skip)
            .populate('studentId', 'name email')
            .populate('courseId', 'title')
            .populate('respondedBy', 'name');

        const total = await Doubt.countDocuments(filter);

        res.status(200).json({
            success: true,
            count: doubts.length,
            total,
            page: Number(page),
            pages: Math.ceil(total / Number(limit)),
            data: doubts,
        });
    } catch (error) {
        next(error);
    }
});

// @route   PUT /api/doubts/admin/:id/respond
// @desc    Add response to a doubt
// @access  Private (Admin)
router.put('/admin/:id/respond', protect, adminOnly, async (req: AuthRequest, res: Response, next) => {
    try {
        const { response, status } = req.body;

        if (!response) {
            throw new AppError('Response is required', 400);
        }

        const doubt = await Doubt.findById(req.params.id);

        if (!doubt) {
            throw new AppError('Doubt not found', 404);
        }

        doubt.response = response;
        doubt.respondedBy = req.user._id;
        doubt.respondedAt = new Date();
        doubt.status = status || 'resolved';

        await doubt.save();

        // Notify student about the response
        await Notification.create({
            userId: doubt.studentId,
            title: 'Doubt Resolved',
            message: `Your doubt "${doubt.subject}" has been answered`,
            type: 'success',
            link: `/doubts`,
        });

        res.status(200).json({
            success: true,
            message: 'Response added successfully',
            data: doubt,
        });
    } catch (error) {
        next(error);
    }
});

// @route   PUT /api/doubts/admin/:id/status
// @desc    Update doubt status
// @access  Private (Admin)
router.put('/admin/:id/status', protect, adminOnly, async (req: AuthRequest, res: Response, next) => {
    try {
        const { status } = req.body;

        if (!status || !['pending', 'in-progress', 'resolved'].includes(status)) {
            throw new AppError('Valid status is required', 400);
        }

        const doubt = await Doubt.findById(req.params.id);

        if (!doubt) {
            throw new AppError('Doubt not found', 404);
        }

        doubt.status = status;
        await doubt.save();

        res.status(200).json({
            success: true,
            message: 'Status updated successfully',
            data: doubt,
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/doubts/admin/statistics
// @desc    Get doubt statistics for dashboard
// @access  Private (Admin)
router.get('/admin/statistics', protect, adminOnly, async (req: AuthRequest, res: Response, next) => {
    try {
        const totalDoubts = await Doubt.countDocuments();
        const pendingDoubts = await Doubt.countDocuments({ status: 'pending' });
        const inProgressDoubts = await Doubt.countDocuments({ status: 'in-progress' });
        const resolvedDoubts = await Doubt.countDocuments({ status: 'resolved' });

        // Get doubts resolved today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const resolvedToday = await Doubt.countDocuments({
            status: 'resolved',
            respondedAt: { $gte: today },
        });

        // Calculate average response time
        const resolvedDoubtsList = await Doubt.find({
            status: 'resolved',
            respondedAt: { $exists: true }
        }).select('createdAt respondedAt');

        let totalResponseTime = 0;
        resolvedDoubtsList.forEach(doubt => {
            if (doubt.respondedAt && doubt.createdAt) {
                const responseTime = doubt.respondedAt.getTime() - doubt.createdAt.getTime();
                totalResponseTime += responseTime;
            }
        });

        const averageResponseTime = resolvedDoubtsList.length > 0
            ? totalResponseTime / resolvedDoubtsList.length / (1000 * 60 * 60) // Convert to hours
            : 0;

        // Doubts by category
        const doubtsByCategory = await Doubt.aggregate([
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                },
            },
            {
                $project: {
                    _id: 0,
                    category: '$_id',
                    count: 1,
                },
            },
        ]);

        // Doubts by course
        const doubtsByCourse = await Doubt.aggregate([
            {
                $match: { courseId: { $exists: true, $ne: null } },
            },
            {
                $group: {
                    _id: '$courseName',
                    count: { $sum: 1 },
                },
            },
            {
                $project: {
                    _id: 0,
                    courseName: '$_id',
                    count: 1,
                },
            },
            {
                $sort: { count: -1 },
            },
            {
                $limit: 10,
            },
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalDoubts,
                pendingDoubts,
                inProgressDoubts,
                resolvedDoubts,
                resolvedToday,
                averageResponseTime: parseFloat(averageResponseTime.toFixed(2)),
                doubtsByCategory,
                doubtsByCourse,
            },
        });
    } catch (error) {
        next(error);
    }
});

// @route   DELETE /api/doubts/admin/:id
// @desc    Delete any doubt (admin privilege)
// @access  Private (Admin)
router.delete('/admin/:id', protect, adminOnly, async (req: AuthRequest, res: Response, next) => {
    try {
        const doubt = await Doubt.findById(req.params.id);

        if (!doubt) {
            throw new AppError('Doubt not found', 404);
        }

        await doubt.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Doubt deleted successfully',
        });
    } catch (error) {
        next(error);
    }
});

export default router;
