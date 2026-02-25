import { Router, Response, Request } from 'express';
import { User } from '../models/User';
import { Course } from '../models/Course';
import { cache } from '../utils/cache';

const router = Router();

const STATS_CACHE_KEY = 'stats:public';
const STATS_TTL = 300; // 5 minutes — stats rarely change

// @route   GET /api/stats/public
// @desc    Get public statistics for home page
// @access  Public
router.get('/public', async (req: Request, res: Response, next) => {
    try {
        // Serve from cache if fresh
        const cached = cache.get<object>(STATS_CACHE_KEY);
        if (cached) {
            return res.status(200).json({ success: true, data: cached, cached: true });
        }

        const [totalStudents, totalCourses] = await Promise.all([
            User.countDocuments({ role: 'student' }),
            Course.countDocuments(),
        ]);

        const data = { totalStudents, totalCourses, successRate: 100 };
        cache.set(STATS_CACHE_KEY, data, STATS_TTL);

        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
});

export default router;
