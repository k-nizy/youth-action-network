const Application = require('../models/Application');

// @desc    Submit new application
// @route   POST /api/applications
// @access  Private
exports.submitApplication = async (req, res) => {
    try {
        const { submissionData, documents } = req.body;

        const application = await Application.create({
            applicant: req.user.id,
            submissionData,
            documents
        });

        res.status(201).json({
            success: true,
            data: application
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get all applications
// @route   GET /api/applications
// @access  Private/Admin
exports.getApplications = async (req, res) => {
    try {
        const applications = await Application.find()
            .populate('applicant', 'name email organization')
            .sort('-submittedAt');

        res.status(200).json({
            success: true,
            count: applications.length,
            data: applications
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get single application
// @route   GET /api/applications/:id
// @access  Private
exports.getApplication = async (req, res) => {
    try {
        const application = await Application.findById(req.params.id)
            .populate('applicant', 'name email organization')
            .populate('reviewedBy', 'name email');

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        res.status(200).json({
            success: true,
            data: application
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update application status (Approve/Reject)
// @route   PATCH /api/applications/:id/status
// @access  Private/Admin
exports.updateApplicationStatus = async (req, res) => {
    try {
        const { status, reviewerNotes } = req.body;

        const application = await Application.findByIdAndUpdate(
            req.params.id,
            {
                status,
                reviewerNotes,
                reviewedBy: req.user.id,
                reviewedAt: Date.now()
            },
            { new: true, runValidators: true }
        );

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        res.status(200).json({
            success: true,
            data: application
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
