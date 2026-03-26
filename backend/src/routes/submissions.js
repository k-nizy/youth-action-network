const express = require('express');
const {
    submitAssignment,
    getMySubmissions,
    getAllSubmissions,
    reviewSubmission
} = require('../controllers/submissionController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
    .post(submitAssignment)
    .get(authorize('admin'), getAllSubmissions);

router.route('/mine')
    .get(getMySubmissions);

router.route('/:id/review')
    .patch(authorize('admin'), reviewSubmission);

module.exports = router;
