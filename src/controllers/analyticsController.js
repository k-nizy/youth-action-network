const Report = require('../models/Report');
const Application = require('../models/Application');
const User = require('../models/User');
const Resource = require('../models/Resource');

// @desc    Submit a report
// @route   POST /api/analytics/report
// @access  Private
exports.submitReport = async (req, res) => {
    try {
        const { reportType, period, metrics } = req.body;

        const report = await Report.create({
            organization: req.user.id,
            reportType,
            period,
            metrics
        });

        res.status(201).json({
            success: true,
            data: report
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get my organization's reports
// @route   GET /api/analytics/my-reports
// @access  Private
exports.getMyReports = async (req, res) => {
    try {
        const reports = await Report.find({ organization: req.user.id })
            .sort('-submittedAt');

        res.status(200).json({
            success: true,
            count: reports.length,
            data: reports
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get dashboard KPIs (Admin only)
// @route   GET /api/analytics/dashboard
// @access  Private/Admin
exports.getDashboard = async (req, res) => {
    try {
        // User Statistics
        const totalUsers = await User.countDocuments();
        const usersByRole = await User.aggregate([
            { $group: { _id: '$role', count: { $sum: 1 } } }
        ]);

        // Application Statistics
        const totalApplications = await Application.countDocuments();
        const applicationsByStatus = await Application.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        // Resource Statistics
        const totalResources = await Resource.countDocuments();
        const resourcesByType = await Resource.aggregate([
            { $group: { _id: '$type', count: { $sum: 1 } } }
        ]);

        // Recent activity
        const recentApplications = await Application.find()
            .sort('-submittedAt')
            .limit(5)
            .populate('applicant', 'name email');

        res.status(200).json({
            success: true,
            data: {
                users: {
                    total: totalUsers,
                    byRole: usersByRole.reduce((acc, item) => {
                        acc[item._id] = item.count;
                        return acc;
                    }, {})
                },
                applications: {
                    total: totalApplications,
                    byStatus: applicationsByStatus.reduce((acc, item) => {
                        acc[item._id] = item.count;
                        return acc;
                    }, {})
                },
                resources: {
                    total: totalResources,
                    byType: resourcesByType.reduce((acc, item) => {
                        acc[item._id] = item.count;
                        return acc;
                    }, {})
                },
                recentActivity: recentApplications
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get all reports (Admin only)
// @route   GET /api/analytics/reports
// @access  Private/Admin
exports.getAllReports = async (req, res) => {
    try {
        const { reportType, period } = req.query;

        const filter = {};
        if (reportType) filter.reportType = reportType;
        if (period) filter.period = period;

        const reports = await Report.find(filter)
            .populate('organization', 'name email organization')
            .sort('-submittedAt');

        res.status(200).json({
            success: true,
            count: reports.length,
            data: reports
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
