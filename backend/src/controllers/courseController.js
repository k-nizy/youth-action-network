const Course = require('../models/Course');


// @desc    Get all courses
// @route   GET /api/v1/courses
// @access  Public
exports.getCourses = async (req, res, next) => {
    try {
        let query;

        // Public users and members only see published
        // Partners see published + their own drafts
        // Admins see everything
        let reqQuery = { ...req.query };

        // If user is logged in
        if (req.user) {
            if (req.user.role === 'admin') {
                // Admin sees all, no filter overrides
            } else if (req.user.role === 'partner') {
                // Partner sees their own, OR any published
                reqQuery = {
                    $or: [
                        { status: 'published' },
                        { createdBy: req.user.id }
                    ],
                    ...reqQuery
                };
            } else {
                reqQuery.status = 'published';
            }
        } else {
            // Unauthenticated sees only published
            reqQuery.status = 'published';
        }

        query = Course.find(reqQuery).populate({
            path: 'organization',
            select: 'name'
        }).populate({
            path: 'lessons',
            select: 'title order isQuiz videoUrl content resources'
        });

        const courses = await query;

        res.status(200).json({
            success: true,
            count: courses.length,
            data: courses
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single course
// @route   GET /api/v1/courses/:id
// @access  Public
exports.getCourse = async (req, res, next) => {
    try {
        const course = await Course.findById(req.params.id)
            .populate({
                path: 'organization',
                select: 'name'
            })
            .populate({
                path: 'lessons',
                select: 'title content order videoUrl resources isQuiz'
            });

        if (!course) {
            return res.status(404).json({ success: false, message: `Course not found with id of ${req.params.id}` });
        }

        // Access control for drafts
        if (course.status !== 'published') {
            if (!req.user || (req.user.role !== 'admin' && course.createdBy.toString() !== req.user.id)) {
                return res.status(403).json({ success: false, message: `Not authorized to access this course` });
            }
        }

        res.status(200).json({
            success: true,
            data: course
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new course
// @route   POST /api/v1/courses
// @access  Private (Partner, Admin)
exports.createCourse = async (req, res, next) => {
    try {
        // Add user to req.body
        req.body.createdBy = req.user.id;

        const course = await Course.create(req.body);

        res.status(201).json({
            success: true,
            data: course
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update course
// @route   PUT /api/v1/courses/:id
// @access  Private (Partner, Admin)
exports.updateCourse = async (req, res, next) => {
    try {
        const course = await Course.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: course
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete course
// @route   DELETE /api/v1/courses/:id
// @access  Private (Partner, Admin)
exports.deleteCourse = async (req, res, next) => {
    try {
        await req.course.remove();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        next(error);
    }
};
