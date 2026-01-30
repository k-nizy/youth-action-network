const express = require('express');
const {
    submitApplication,
    getApplications,
    getApplication,
    updateApplicationStatus
} = require('../controllers/applicationController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, submitApplication);
router.get('/', protect, authorize('admin'), getApplications);
router.get('/:id', protect, getApplication);
router.patch('/:id/status', protect, authorize('admin'), updateApplicationStatus);

module.exports = router;
