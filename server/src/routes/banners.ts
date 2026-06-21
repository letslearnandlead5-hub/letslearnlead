import { Router, Response } from 'express';
import { Banner } from '../models/Banner';
import { protect, authorize, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/error';

const router = Router();

// @route   GET /api/banners
// @desc    Get all active banners (for mobile app)
// @access  Public
router.get('/', async (req, res, next) => {
    try {
        const banners = await Banner.find({ isActive: true })
            .sort({ order: 1, createdAt: -1 })
            .select('-__v')
            .lean();

        res.status(200).json({
            success: true,
            count: banners.length,
            data: banners,
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/banners/all
// @desc    Get all banners (for admin panel)
// @access  Private (Admin)
router.get('/all', protect, authorize('admin'), async (req: AuthRequest, res: Response, next) => {
    try {
        const banners = await Banner.find()
            .sort({ order: 1, createdAt: -1 })
            .select('-__v');

        res.status(200).json({
            success: true,
            count: banners.length,
            data: banners,
        });
    } catch (error) {
        next(error);
    }
});

// @route   POST /api/banners
// @desc    Create a new banner
// @access  Private (Admin)
router.post('/', protect, authorize('admin'), async (req: AuthRequest, res: Response, next) => {
    try {
        const {
            title,
            subtitle,
            discount,
            cta,
            image,
            bgGradient,
            actionType,
            actionId,
            actionName,
            actionQuery,
            isActive,
            order,
        } = req.body;

        const banner = await Banner.create({
            title,
            subtitle,
            discount,
            cta,
            image,
            bgGradient,
            actionType,
            actionId,
            actionName,
            actionQuery,
            isActive: isActive !== undefined ? isActive : true,
            order: order || 0,
        });

        res.status(201).json({
            success: true,
            data: banner,
        });
    } catch (error) {
        next(error);
    }
});

// @route   PUT /api/banners/:id
// @desc    Update a banner
// @access  Private (Admin)
router.put('/:id', protect, authorize('admin'), async (req: AuthRequest, res: Response, next) => {
    try {
        const banner = await Banner.findById(req.params.id);

        if (!banner) {
            throw new AppError('Banner not found', 404);
        }

        const {
            title,
            subtitle,
            discount,
            cta,
            image,
            bgGradient,
            actionType,
            actionId,
            actionName,
            actionQuery,
            isActive,
            order,
        } = req.body;

        banner.title = title || banner.title;
        banner.subtitle = subtitle || banner.subtitle;
        banner.discount = discount || banner.discount;
        banner.cta = cta || banner.cta;
        banner.image = image || banner.image;
        banner.bgGradient = bgGradient || banner.bgGradient;
        banner.actionType = actionType || banner.actionType;
        banner.actionId = actionId !== undefined ? actionId : banner.actionId;
        banner.actionName = actionName !== undefined ? actionName : banner.actionName;
        banner.actionQuery = actionQuery !== undefined ? actionQuery : banner.actionQuery;
        banner.isActive = isActive !== undefined ? isActive : banner.isActive;
        banner.order = order !== undefined ? order : banner.order;

        await banner.save();

        res.status(200).json({
            success: true,
            data: banner,
        });
    } catch (error) {
        next(error);
    }
});

// @route   DELETE /api/banners/:id
// @desc    Delete a banner
// @access  Private (Admin)
router.delete('/:id', protect, authorize('admin'), async (req: AuthRequest, res: Response, next) => {
    try {
        const banner = await Banner.findById(req.params.id);

        if (!banner) {
            throw new AppError('Banner not found', 404);
        }

        await banner.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Banner deleted successfully',
        });
    } catch (error) {
        next(error);
    }
});

export default router;
