import { Router, Response, Request } from 'express';
import { User } from '../models/User';
import { Course } from '../models/Course';

const router = Router();

// @route   GET /api/stats/public
// @desc    Get public statistics for home page
// @access  Public
router.get('/public', async (req: Request, res: Response, next) => {
    try {
        // Count total students
        const totalStudents = await User.countDocuments({ role: 'student' });
        
        // Count total courses
        const totalCourses = await Course.countDocuments();
        
        // Calculate success rate (average course completion)
        // For now, we'll use 100% as default or calculate based on completed enrollments
        const successRate = 100;

        res.status(200).json({
            success: true,
            data: {
                totalStudents,
                totalCourses,
                successRate,
            },
        });
    } catch (error) {
        next(error);
    }
});

export default router;
