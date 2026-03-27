const Lesson = require('../models/Lesson');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Certificate = require('../models/Certificate');
const { getCurrentQuarter } = require('../utils/quarterUtils');

// @desc    Get user progress for a course
// @route   GET /api/v1/progress/:courseId/progress
// @access  Private
exports.getCourseProgress = async (req, res, next) => {
    try {
        const enrollment = await Enrollment.findOne({
            user: req.user.id,
            course: req.params.courseId
        }).populate('completedLessons', 'title _id');

        if (!enrollment) {
            return res.status(404).json({ success: false, message: 'Enrollment not found' });
        }

        res.status(200).json({
            success: true,
            data: enrollment
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update progress for a lesson
// @route   PATCH /api/v1/progress/:courseId/lesson/:lessonId
// @access  Private
exports.updateProgress = async (req, res, next) => {
    try {
        const { courseId, lessonId } = req.params;

        // Find user's enrollment
        const enrollment = await Enrollment.findOne({
            user: req.user.id,
            course: courseId
        });

        if (!enrollment) {
            return res.status(403).json({ success: false, message: `Not enrolled in this course` });
        }

        // Quarter Locking Logic
        // const course = await Course.findById(courseId);
        // const currentQuarter = getCurrentQuarter();
        // if (course && course.quarter !== currentQuarter) {
        //     return res.status(403).json({
        //         success: false,
        //         message: `This course's assignments are currently locked. They are scheduled for ${course.quarter} (Current: ${currentQuarter}).`
        //     });
        // }

        enrollment.lastAccessedLesson = lessonId;

        // Add lesson to completedLessons if not already there
        if (!enrollment.completedLessons.includes(lessonId)) {
            enrollment.completedLessons.push(lessonId);

            // Smart computation: Get total lessons count for the course
            const totalLessons = await Lesson.countDocuments({ course: courseId });

            if (totalLessons === 0) {
                return res.status(400).json({ success: false, message: `Course has no lessons` });
            }

            // Update progress percentage
            const completedCount = enrollment.completedLessons.length;
            let progressRaw = Math.round((completedCount / totalLessons) * 100);

            // Cap at 100
            enrollment.progress = progressRaw > 100 ? 100 : progressRaw;

            // Mark completed if 100%
            if (completedCount >= totalLessons) {
                enrollment.status = 'completed';
                enrollment.completionDate = Date.now();
                enrollment.progress = 100;

                // Create certificate if it doesn't exist
                const existingCert = await Certificate.findOne({
                    user: req.user.id,
                    course: courseId
                });

                if (!existingCert) {
                    await Certificate.create({
                        user: req.user.id,
                        course: courseId,
                        completionDate: Date.now()
                    });
                }
            }

            await enrollment.save();
        } else {
            // Just update last accessed
            await enrollment.save();
        }

        res.status(200).json({
            success: true,
            data: enrollment
        });
    } catch (error) {
        console.error("DEBUG INTERNAL ERROR:", error);
        next(error);
    }
};
