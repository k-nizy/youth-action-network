const express = require('express');
const {
    submitReport,
    getMyReports,
    getDashboard,
    getAllReports
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/report', protect, submitReport);
router.get('/my-reports', protect, getMyReports);
router.get('/dashboard', protect, authorize('admin'), getDashboard);
router.get('/reports', protect, authorize('admin'), getAllReports);

module.exports = router;
