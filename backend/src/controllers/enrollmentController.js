const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const { getCurrentQuarter } = require('../utils/quarterUtils');


// @desc    Get logged in user's enrollments
// @route   GET /api/v1/enrollments
// @access  Private
exports.getEnrollments = async (req, res, next) => {
    try {
        const enrollments = await Enrollment.find({ user: req.user.id })
            .populate({
                path: 'course',
                select: 'title description difficulty duration status quarter category',
                populate: {
                    path: 'lessons',
                    select: 'title order isQuiz videoUrl content resources'
                }
            })
            .populate({
                path: 'lastAccessedLesson',
                select: 'title'
            })
            .sort('-enrollmentDate');

        res.status(200).json({
            success: true,
            count: enrollments.length,
            data: enrollments
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Enroll in a course
// @route   POST /api/v1/courses/:id/enroll
// @access  Private
exports.createEnrollment = async (req, res, next) => {
    try {
        // Find the course
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({ success: false, message: `No course found with id of ${req.params.id}` });
        }

        // Make sure course is published
        if (course.status !== 'published') {
            return res.status(400).json({ success: false, message: `Cannot enroll in an unpublished course` });
        }

        // Quarter Locking Logic
        // const currentQuarter = getCurrentQuarter();
        // if (course.quarter !== currentQuarter) {
        //     return res.status(403).json({
        //         success: false,
        //         message: `This course is scheduled for ${course.quarter}. You can only enroll during that quarter (Current: ${currentQuarter}).`
        //     });
        // }

        // Check for existing enrollment
        const existingEnrollment = await Enrollment.findOne({
            user: req.user.id,
            course: req.params.id
        });

        if (existingEnrollment) {
            return res.status(400).json({ success: false, message: `User is already enrolled in this course` });
        }

        const enrollment = await Enrollment.create({
            user: req.user.id,
            course: req.params.id
        });

        res.status(201).json({
            success: true,
            data: enrollment
        });
    } catch (error) {
        next(error);
    }
};
