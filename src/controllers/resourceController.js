const Resource = require('../models/Resource');
const Progress = require('../models/Progress');

// @desc    Get all resources
// @route   GET /api/resources
// @access  Private
exports.getResources = async (req, res) => {
    try {
        const { category, type, difficulty } = req.query;

        // Build filter
        const filter = {};
        if (category) filter.category = category;
        if (type) filter.type = type;
        if (difficulty) filter.difficulty = difficulty;

        const resources = await Resource.find(filter)
            .populate('uploadedBy', 'name organization')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            count: resources.length,
            data: resources
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get single resource
// @route   GET /api/resources/:id
// @access  Private
exports.getResource = async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.id)
            .populate('uploadedBy', 'name organization');

        if (!resource) {
            return res.status(404).json({
                success: false,
                message: 'Resource not found'
            });
        }

        res.status(200).json({
            success: true,
            data: resource
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Upload/Create resource
// @route   POST /api/resources
// @access  Private/Admin
exports.createResource = async (req, res) => {
    try {
        const { title, description, type, url, category, skillArea, difficulty } = req.body;

        const resource = await Resource.create({
            title,
            description,
            type,
            url,
            category,
            skillArea,
            difficulty,
            uploadedBy: req.user.id
        });

        res.status(201).json({
            success: true,
            data: resource
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update resource
// @route   PUT /api/resources/:id
// @access  Private/Admin
exports.updateResource = async (req, res) => {
    try {
        const resource = await Resource.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!resource) {
            return res.status(404).json({
                success: false,
                message: 'Resource not found'
            });
        }

        res.status(200).json({
            success: true,
            data: resource
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Delete resource
// @route   DELETE /api/resources/:id
// @access  Private/Admin
exports.deleteResource = async (req, res) => {
    try {
        const resource = await Resource.findByIdAndDelete(req.params.id);

        if (!resource) {
            return res.status(404).json({
                success: false,
                message: 'Resource not found'
            });
        }

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Mark resource as completed
// @route   POST /api/resources/:id/complete
// @access  Private
exports.completeResource = async (req, res) => {
    try {
        const progress = await Progress.findOneAndUpdate(
            { user: req.user.id, resource: req.params.id },
            {
                completed: true,
                completedAt: Date.now()
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        res.status(200).json({
            success: true,
            data: progress
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get user's progress
// @route   GET /api/resources/progress/me
// @access  Private
exports.getMyProgress = async (req, res) => {
    try {
        const progress = await Progress.find({ user: req.user.id })
            .populate('resource', 'title type category');

        res.status(200).json({
            success: true,
            count: progress.length,
            data: progress
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
