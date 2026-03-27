const express = require('express');
const {
    getUsers,
    updateUserRole,
    updateOrganizationStatus,
    getSystemStats,
    getLmsAnalytics
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { check } = require('express-validator');

const router = express.Router();

// Apply protect and admin authorization to ALL admin routes
router.use(protect);
router.use(authorize('admin'));

router.route('/users')
    .get(getUsers);

router.route('/users/:id/role')
    .patch(
        [
            check('role', 'Role is required').not().isEmpty()
        ],
        validate,
        updateUserRole
    );

router.route('/organizations/:id/status')
    .patch(
        [
            check('status', 'Status is required').not().isEmpty()
        ],
        validate,
        updateOrganizationStatus
    );

router.route('/system-stats')
    .get(getSystemStats);

router.route('/lms-analytics')
    .get(getLmsAnalytics);

router.route('/seed-capacity-building')
    .post(require('../controllers/adminController').seedCapacityBuilding);

router.route('/recent-applications')
    .get(require('../controllers/adminController').getRecentApplications);

module.exports = router;
