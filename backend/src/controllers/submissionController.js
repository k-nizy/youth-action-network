const Submission = require('../models/Submission');
const Course = require('../models/Course');
const User = require('../models/User');

// @desc    Submit a new assignment
// @route   POST /api/v1/submissions
// @access  Private
exports.submitAssignment = async (req, res, next) => {
    try {
        const { courseId, quarter, fileUrl, fileName, fileFormat } = req.body;

        // Verify course exists
        const course = await Course.findById(courseId);
        if (!course) {
            const err = new Error(`No course found with id of ${courseId}`);
            err.statusCode = 404;
            return next(err);
        }

        const submission = await Submission.create({
            user: req.user.id,
            course: courseId,
            quarter,
            fileUrl,
            fileName,
            fileFormat
        });

        res.status(201).json({
            success: true,
            data: submission
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get logged in user's submissions
// @route   GET /api/v1/submissions/mine
// @access  Private
exports.getMySubmissions = async (req, res, next) => {
    try {
        const submissions = await Submission.find({ user: req.user.id })
            .populate('course', 'title category')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            count: submissions.length,
            data: submissions
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Review / grade a submission
// @route   PATCH /api/v1/submissions/:id/review
// @access  Private/Admin
exports.reviewSubmission = async (req, res, next) => {
    try {
        const { status, grade, feedback } = req.body;

        const validStatuses = ['pending', 'reviewed', 'graded'];
        if (status && !validStatuses.includes(status)) {
            const err = new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
            err.statusCode = 400;
            return next(err);
        }

        const submission = await Submission.findById(req.params.id);
        if (!submission) {
            const err = new Error(`No submission found with id of ${req.params.id}`);
            err.statusCode = 404;
            return next(err);
        }

        const updateData = {};
        if (status) updateData.status = status;
        if (grade !== undefined && grade !== null) {
            if (grade < 0 || grade > 100) {
                const err = new Error('Grade must be between 0 and 100');
                err.statusCode = 400;
                return next(err);
            }
            updateData.grade = grade;
            // If a grade is provided, auto-promote to graded
            updateData.status = 'graded';
        }
        if (feedback !== undefined) updateData.feedback = feedback;
        updateData.reviewedBy = req.user.id;
        updateData.reviewedAt = new Date();

        const updated = await Submission.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true, runValidators: true }
        )
            .populate('user', 'name email organization')
            .populate('course', 'title')
            .populate('reviewedBy', 'name');

        res.status(200).json({
            success: true,
            data: updated
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all submissions
// @route   GET /api/v1/submissions
// @access  Private/Admin
exports.getAllSubmissions = async (req, res, next) => {
    try {
        const submissions = await Submission.find()
            .populate('user', 'name email organization')
            .populate('course', 'title')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            count: submissions.length,
            data: submissions
        });
    } catch (error) {
        next(error);
    }
};
